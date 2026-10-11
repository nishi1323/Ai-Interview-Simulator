import { useEffect, useRef, useState } from 'react';
import { analyzeSpeech, evaluateAnswer } from '../services/api';

const prompts = [
  'Describe how you would design a scalable payment service.',
  'Tell me about a technical decision you made and the trade-offs involved.',
  'How would you investigate a production issue with incomplete logs?',
];

export default function VoiceInterviewPage() {
  const recognitionRef = useRef(null);
  const startedAtRef = useRef(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [speech, setSpeech] = useState(null);
  const [error, setError] = useState('');
  const recognitionSupported = typeof window !== 'undefined'
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const startRecording = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Speech recognition is unavailable in this browser. Type your response below instead.');
      return;
    }

    setError('');
    setEvaluation(null);
    setSpeech(null);
    setTranscript('');
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const captured = Array.from(event.results).map((result) => result[0].transcript).join(' ');
      setTranscript(captured);
    };
    recognition.onerror = (event) => {
      setError(event.error === 'not-allowed' ? 'Microphone permission was denied. Allow microphone access or type your response.' : `Speech recognition error: ${event.error}.`);
      setRecording(false);
    };
    recognition.onend = () => setRecording(false);
    recognitionRef.current = recognition;
    startedAtRef.current = Date.now();
    try {
      recognition.start();
      setRecording(true);
    } catch {
      setError('Could not start speech recognition. Type your response below instead.');
    }
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setRecording(false);
  };

  const submitResponse = async () => {
    if (!transcript.trim()) return;
    setLoading(true);
    setError('');
    try {
      const duration = startedAtRef.current ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)) : 60;
      const [answerResult, speechResult] = await Promise.all([
        evaluateAnswer(transcript.trim()),
        analyzeSpeech(transcript.trim(), duration),
      ]);
      setEvaluation(answerResult.data);
      setSpeech(speechResult.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not evaluate this response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextPrompt = () => {
    setPromptIndex((current) => (current + 1) % prompts.length);
    setTranscript('');
    setEvaluation(null);
    setSpeech(null);
    setError('');
  };

  return (
    <div className="page-shell">
      <div className="card panel voice-panel">
        <div className="row-between">
          <span className="eyebrow">Voice interview mode</span>
          {speech && <strong>Delivery estimate: {speech.confidenceDeliveryEstimate}/100</strong>}
        </div>
        <h3>{prompts[promptIndex]}</h3>
        <div className="mic-controls">
          <button className="primary-btn" type="button" onClick={startRecording} disabled={recording || !recognitionSupported}>
            {recording ? 'Listening…' : 'Start recording'}
          </button>
          <button className="secondary-btn" type="button" onClick={stopRecording} disabled={!recording}>Stop recording</button>
          <button className="secondary-btn" type="button" onClick={nextPrompt} disabled={recording}>New prompt</button>
        </div>
        {!recognitionSupported && <p className="alert info">Speech recognition is not supported here. You can type your answer and submit it for analysis.</p>}
        <label className="voice-transcript-label">Your response
          <textarea rows="7" value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Your speech transcript appears here. You can also type your response." />
        </label>
        {error && <p className="alert error" role="alert">{error}</p>}
        <div className="row-between">
          <button className="primary-btn" type="button" onClick={submitResponse} disabled={loading || !transcript.trim()}>
            {loading ? 'Analyzing…' : 'Analyze response'}
          </button>
          {speech && <span>{speech.wordsPerMinute} words/min · {speech.wordCount} words</span>}
        </div>
        {evaluation && speech && (
          <div className="report-box" role="status">
            <strong>Response score: {evaluation.score}/100</strong>
            <p>{evaluation.feedback}</p>
            <p>Delivery estimate: {speech.confidenceDeliveryEstimate}/100</p>
            <p>Filler words: {Object.entries(speech.fillerWords).map(([word, count]) => `${word} (${count})`).join(', ') || 'None detected'}</p>
            <p>{speech.feedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}
