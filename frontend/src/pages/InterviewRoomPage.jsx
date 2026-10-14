import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getInterviewDetails, submitAnswer } from '../services/api';

export default function InterviewRoomPage() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    let active = true;
    getInterviewDetails(interviewId)
      .then(({ data }) => {
        if (!active) return;
        setInterview(data);
        const nextQuestion = data.questions?.findIndex((item) => !item.answered) ?? -1;
        if (nextQuestion < 0) {
          navigate(`/result/${interviewId}`, { replace: true });
        } else {
          setQuestionIndex(nextQuestion);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load this interview.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [interviewId, navigate]);

  // Question Timer
  useEffect(() => {
    if (evaluation) return;
    const interval = setInterval(() => {
      setElapsedSeconds((sec) => sec + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [questionIndex, evaluation]);

  const question = interview?.questions?.[questionIndex];
  const totalQuestions = interview?.questions?.length || 1;
  const progressPercent = Math.round(((questionIndex + (evaluation ? 1 : 0)) / totalQuestions) * 100);

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const formatTimer = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const saveAnswer = async () => {
    if (!question || !answer.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const { data } = await submitAnswer(interviewId, { questionId: question.id, answer: answer.trim() });
      setEvaluation(data);
      setInterview((current) => ({
        ...current,
        questions: current.questions.map((item) => item.id === question.id ? { ...item, answered: true } : item),
      }));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goToNextQuestion = () => {
    if (questionIndex === interview.questions.length - 1) {
      navigate(`/result/${interviewId}`);
      return;
    }
    setQuestionIndex((index) => index + 1);
    setAnswer('');
    setEvaluation(null);
    setElapsedSeconds(0);
  };

  if (loading) {
    return (
      <main className="page-shell" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p>Loading your interview session…</p>
      </main>
    );
  }

  if (error && !interview) {
    return (
      <main className="page-shell">
        <p className="alert error" role="alert">{error}</p>
        <Link className="primary-btn" to="/history">Back to Interview History</Link>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="page-shell">
        <p className="alert info">This interview session has no pending questions.</p>
        <Link className="primary-btn" to="/interview-config">Configure New Interview</Link>
      </main>
    );
  }

  return (
    <div className="page-shell interview-room">
      {/* Top Progress & Meta Bar */}
      <div className="card panel" style={{ padding: '16px 20px' }}>
        <div className="interview-meta-bar">
          <div>
            <span className="eyebrow" style={{ color: 'var(--accent)' }}>
              Question {questionIndex + 1} of {totalQuestions}
            </span>
            <strong style={{ display: 'block', fontSize: '0.95rem', color: '#fff' }}>
              {[interview.jobRole, interview.interviewType, interview.difficulty].filter(Boolean).join(' · ')}
            </strong>
          </div>
          <div className="timer-badge">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Question Progress Track */}
        <div className="progress" style={{ marginTop: '12px', height: '6px' }}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Question Prompt Panel */}
      <div className="card panel question-panel">
        <span className="eyebrow">Interview Question</span>
        <h3>{question.prompt}</h3>
      </div>

      {/* Answer Workspace Panel */}
      <div className="card panel answer-panel">
        <div className="row-between">
          <label htmlFor="interview-answer-input" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            Your Answer
          </label>
          <span className="answer-counter">
            {wordCount} words · {answer.length} characters
          </span>
        </div>

        <textarea
          id="interview-answer-input"
          rows={9}
          placeholder="Type your comprehensive response here. Include technical principles, examples, and trade-offs where applicable..."
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={Boolean(evaluation) || submitting}
        />

        {error && <p className="alert error" role="alert">{error}</p>}

        {evaluation && (
          <div className="evaluation-card" role="status">
            <div className="evaluation-score-row">
              <strong style={{ color: '#fff', fontSize: '1.05rem' }}>AI Evaluation Feedback</strong>
              <span className="score-meter">
                Score: {evaluation.score}/100
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.94rem' }}>
              {evaluation.feedback}
            </p>
          </div>
        )}

        <div className="row-between" style={{ marginTop: '8px' }}>
          <button
            className="secondary-btn"
            onClick={saveAnswer}
            disabled={submitting || Boolean(evaluation) || !answer.trim()}
          >
            {submitting ? 'Evaluating with AI…' : evaluation ? 'Answer Evaluated' : 'Submit Answer'}
          </button>

          {evaluation && (
            <button className="primary-btn" onClick={goToNextQuestion}>
              {questionIndex === interview.questions.length - 1 ? 'Complete & View Results →' : 'Next Question →'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
