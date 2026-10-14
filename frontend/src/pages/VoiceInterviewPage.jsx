import { useEffect, useRef, useState } from 'react';
import { analyzeSpeech, evaluateAnswer } from '../services/api';

const prompts = [
  'Describe how you would design a scalable, resilient payment service in a distributed microservices environment.',
  'Tell me about an important architectural decision you made, the alternatives considered, and the resulting trade-offs.',
  'How would you investigate and resolve a critical production latency spike with incomplete application logs?',
  'Explain the difference between optimistic and pessimistic locking and when you would choose each in high-concurrency systems.',
  'How do you approach writing clean, maintainable code while meeting aggressive project delivery deadlines?',
];

export default function VoiceInterviewPage() {
  const recognitionRef = useRef(null);
  const startedAtRef = useRef(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [speech, setSpeech] = useState(null);
  const [error, setError] = useState('');

  const recognitionSupported = typeof window !== 'undefined'
    && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  // Timer while recording
  useEffect(() => {
    let timer;
    if (recording) {
      timer = setInterval(() => {
        setRecordingSeconds((sec) => sec + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [recording]);

  const startRecording = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Speech recognition is unavailable in this browser. You can type your answer below instead.');
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
      setError(event.error === 'not-allowed'
        ? 'Microphone permission was denied. Please allow microphone access or type your response.'
        : `Speech recognition error: ${event.error}.`);
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
      const duration = startedAtRef.current
        ? Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000))
        : 60;
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

  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Voice Practice Lab</span>
          <h2>Speech Pacing & Verbal Delivery</h2>
          <p style={{ margin: '6px 0 0' }}>Practice answering behavioral and architectural prompts aloud to analyze verbal clarity, pacing, and filler words.</p>
        </div>
      </header>

      <div className="card panel voice-panel">
        <div className="row-between">
          <span className="eyebrow">Prompt {promptIndex + 1} of {prompts.length}</span>
          {recording && (
            <span className="badge badge-danger recording-pulse-active" style={{ fontSize: '0.85rem' }}>
              ● Recording ({formatTimer(recordingSeconds)})
            </span>
          )}
        </div>

        <h3 style={{ fontSize: '1.4rem', color: '#fff', lineHeight: 1.4 }}>
          {prompts[promptIndex]}
        </h3>

        <div className="mic-controls">
          {!recording ? (
            <button
              className="primary-btn"
              type="button"
              onClick={startRecording}
              disabled={!recognitionSupported || loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
              Start Recording Answer
            </button>
          ) : (
            <button
              className="primary-btn"
              type="button"
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)' }}
              onClick={stopRecording}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop Recording
            </button>
          )}

          <button className="secondary-btn" type="button" onClick={nextPrompt} disabled={recording}>
            Try Another Prompt
          </button>
        </div>

        {!recognitionSupported && (
          <p className="alert info">
            Speech recognition is unavailable in your current browser. You can type your response below to analyze verbal structure.
          </p>
        )}

        <div>
          <label htmlFor="voice-transcript" style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-muted)' }}>
            Captured Speech Transcript
          </label>
          <textarea
            id="voice-transcript"
            rows={7}
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Your spoken words will transcribe here automatically. You can also edit or type manually..."
          />
        </div>

        {error && <p className="alert error" role="alert">{error}</p>}

        <div className="row-between">
          <button
            className="primary-btn"
            type="button"
            onClick={submitResponse}
            disabled={loading || !transcript.trim() || recording}
          >
            {loading ? 'Analyzing Speech Delivery…' : 'Analyze Delivery & Content'}
          </button>
          {speech && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-primary">{speech.wordsPerMinute} WPM</span>
              <span className="badge badge-success">{speech.wordCount} words</span>
            </div>
          )}
        </div>

        {/* Evaluation and Delivery Breakdown */}
        {evaluation && speech && (
          <div className="report-box" role="status">
            <div className="row-between">
              <strong>Evaluation Summary</strong>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>
                  Content: {evaluation.score}/100
                </span>
                <span className="badge badge-success" style={{ fontSize: '0.85rem' }}>
                  Delivery: {speech.confidenceDeliveryEstimate}/100
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <strong style={{ fontSize: '0.92rem', color: 'var(--accent)' }}>Answer Depth & Technical Quality</strong>
              <p style={{ marginTop: '4px' }}>{evaluation.feedback}</p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <strong style={{ fontSize: '0.92rem', color: 'var(--accent)' }}>Pacing & Delivery Advice</strong>
              <p style={{ marginTop: '4px' }}>{speech.feedback}</p>
              <div style={{ marginTop: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Filler Words Detected:{' '}
                  {Object.keys(speech.fillerWords || {}).length > 0
                    ? Object.entries(speech.fillerWords).map(([word, count]) => `${word} (${count})`).join(', ')
                    : 'None detected (Great articulation!)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
