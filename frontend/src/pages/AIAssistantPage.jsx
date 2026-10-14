import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatWithAssistant } from '../services/api';

const suggestions = [
  'What should I improve in my resume for a Senior Java Developer role?',
  'How should I prepare for a System Design interview next week?',
  'What were my weakest areas in my latest mock interview?',
  'Give me 3 behavioral questions for leadership and conflict resolution.',
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Candidate';
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
      const history = messages.slice(-10).map(({ role, text: msgText }) => ({ role, content: msgText }));
      const { data } = await chatWithAssistant(message, history);
      if (data.mode === 'BUILT_IN') {
        setError('Groq API key is not configured on the backend. Responses use built-in coaching rules; set GROQ_API_KEY for dynamic generative answers.');
      }
      setMessages((current) => [...current, { role: 'assistant', text: data.reply }]);
      requestAnimationFrame(() => {
        transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The AI assistant could not respond. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <main className="page-shell assistant-page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Personal Career Coach</span>
          <h2>AI Career Advisor</h2>
          <p style={{ margin: '6px 0 0' }}>Get tailored guidance, interview strategy, and actionable tips based on your resume and past mock scores.</p>
        </div>
        <span className="badge badge-success">
          <span className="status-indicator" /> Connected
        </span>
      </header>

      <section className="assistant-card card" aria-label="Career assistant conversation">
        <div className="assistant-transcript" ref={transcriptRef} aria-live="polite">
          <div className="assistant-message assistant-message-bot">
            <span className="assistant-avatar" aria-hidden="true">AI</span>
            <div>
              <strong style={{ color: '#fff', fontSize: '0.92rem' }}>AI Career Coach</strong>
              <p>
                Hello {firstName}! I analyze your uploaded resume and mock interview evaluations to help you target high-yield preparation. What would you like to focus on today?
              </p>
            </div>
          </div>

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`assistant-message ${message.role === 'user' ? 'assistant-message-user' : 'assistant-message-bot'}`}
            >
              {message.role === 'assistant' && (
                <span className="assistant-avatar" aria-hidden="true">AI</span>
              )}
              <div>
                {message.role === 'assistant' && (
                  <strong style={{ color: '#fff', fontSize: '0.92rem' }}>AI Career Coach</strong>
                )}
                <p>{message.text}</p>
              </div>
            </div>
          ))}

          {sending && (
            <div className="assistant-message assistant-message-bot" role="status">
              <span className="assistant-avatar" aria-hidden="true">AI</span>
              <div>
                <strong style={{ color: '#fff', fontSize: '0.92rem' }}>AI Career Coach</strong>
                <p style={{ color: 'var(--text-muted)' }}>Analyzing your query and generating recommendations…</p>
              </div>
            </div>
          )}
        </div>

        {messages.length === 0 && (
          <div className="assistant-suggestions" aria-label="Suggested discussion questions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="secondary-btn"
                onClick={() => sendMessage(suggestion)}
                disabled={sending}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p
            className={`alert ${error.startsWith('Groq API key is not configured') ? 'info' : 'error'}`}
            role={error.startsWith('Groq API key is not configured') ? 'status' : 'alert'}
          >
            {error}
          </p>
        )}

        <form
          className="assistant-composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <label className="sr-only" htmlFor="assistant-message">Ask your assistant</label>
          <textarea
            id="assistant-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your resume, interview strategy, or skill improvements (Press Enter to send)..."
            rows={2}
            maxLength={1000}
            disabled={sending}
          />
          <button className="primary-btn" type="submit" disabled={!draft.trim() || sending}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
            Send
          </button>
        </form>

        <small className="assistant-disclaimer">
          AI coaching leverages your session history and resume highlights to generate recommendations.
        </small>
      </section>
    </main>
  );
}
