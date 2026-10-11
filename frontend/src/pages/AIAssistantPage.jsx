import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatWithAssistant } from '../services/api';

const suggestions = [
  'What should I improve in my resume?',
  'How should I prepare for my next interview?',
  'What should I focus on next?',
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const transcriptRef = useRef(null);

  const sendMessage = async (text = draft) => {
    const message = text.trim();
    if (!message || sending) return;

    setMessages((current) => [...current, { role: 'user', text: message }]);
    setDraft('');
    setError('');
    setSending(true);
    try {
      const history = messages.slice(-10).map(({ role, text }) => ({ role, content: text }));
      const { data } = await chatWithAssistant(message, history);
      if (data.mode === 'BUILT_IN') {
        setError('The external AI provider is not configured. Replies are limited to built-in coaching; set OPENAI_API_KEY on the backend for adaptive answers.');
      }
      setMessages((current) => [...current, { role: 'assistant', text: data.reply }]);
      requestAnimationFrame(() => {
        transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The assistant could not respond. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="page-shell assistant-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Your career coach</span>
          <h2>Personalized AI assistant</h2>
          <p className="assistant-subtitle">Get guidance grounded in your resume and interview progress.</p>
        </div>
        <span className="assistant-status"><span aria-hidden="true" /> Tailored to your account</span>
      </header>

      <section className="assistant-card card" aria-label="Career assistant chat">
        <div className="assistant-transcript" ref={transcriptRef} aria-live="polite">
          <div className="assistant-message assistant-message-bot">
            <span className="assistant-avatar" aria-hidden="true">AI</span>
            <div>
              <strong>Your assistant</strong>
              <p>Hi {firstName}! I can use your latest resume and interview scores to help you plan practice, improve your resume, or choose a next step. What would you like help with?</p>
            </div>
          </div>
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`assistant-message ${message.role === 'user' ? 'assistant-message-user' : 'assistant-message-bot'}`}>
              {message.role === 'assistant' && <span className="assistant-avatar" aria-hidden="true">AI</span>}
              <div>
                {message.role === 'assistant' && <strong>Your assistant</strong>}
                <p>{message.text}</p>
              </div>
            </div>
          ))}
          {sending && (
            <div className="assistant-message assistant-message-bot" role="status">
              <span className="assistant-avatar" aria-hidden="true">AI</span>
              <div><strong>Your assistant</strong><p>Thinking about your progress…</p></div>
            </div>
          )}
        </div>

        {messages.length === 0 && (
          <div className="assistant-suggestions" aria-label="Suggested questions">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" className="secondary-btn" onClick={() => sendMessage(suggestion)} disabled={sending}>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {error && <p className={`alert ${error.startsWith('The external AI provider') ? 'info' : 'error'}`} role={error.startsWith('The external AI provider') ? 'status' : 'alert'}>{error}</p>}

        <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); sendMessage(); }}>
          <label className="sr-only" htmlFor="assistant-message">Ask your assistant</label>
          <textarea
            id="assistant-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about your resume, interview preparation, or next steps…"
            rows={2}
            maxLength={1000}
            disabled={sending}
          />
          <button className="primary-btn" type="submit" disabled={!draft.trim() || sending}>Send</button>
        </form>
        <small className="assistant-disclaimer">
          When OpenAI is configured, your question, recent chat turns, and a limited summary of extracted resume skills and interview scores are sent for a response. Raw resume text and account identifiers are not included. Without a provider key, the app uses limited built-in coaching logic.
        </small>
      </section>
    </main>
  );
}
