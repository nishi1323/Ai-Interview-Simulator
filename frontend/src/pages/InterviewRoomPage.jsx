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
  }, [interviewId]);

  const question = interview?.questions?.[questionIndex];

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
  };

  if (loading) return <main className="page-shell"><p>Loading interview…</p></main>;
  if (error && !interview) return <main className="page-shell"><p className="alert error">{error}</p><Link to="/history">Back to history</Link></main>;
  if (!question) return <main className="page-shell"><p className="alert info">This interview has no questions.</p><Link to="/interview-config">Create an interview</Link></main>;

  return (
    <div className="page-shell interview-room">
      <div className="card panel question-panel">
        <div className="row-between">
          <span className="eyebrow">Question {questionIndex + 1} of {interview.questions.length}</span>
          <strong>{[interview.jobRole, interview.difficulty].filter(Boolean).join(' · ')}</strong>
        </div>
        <h3>{question.prompt}</h3>
      </div>

      <div className="card panel answer-panel">
        <textarea
          rows="8"
          placeholder="Write your answer here..."
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          disabled={Boolean(evaluation)}
        />
        {error && <p className="alert error" role="alert">{error}</p>}
        {evaluation && <p className="alert info" role="status">Answer score: {evaluation.score}/100. {evaluation.feedback}</p>}
        <div className="row-between">
          <button className="secondary-btn" onClick={saveAnswer} disabled={submitting || Boolean(evaluation) || !answer.trim()}>
            {submitting ? 'Saving…' : evaluation ? 'Answer saved' : 'Submit answer'}
          </button>
          {evaluation && <button className="primary-btn" onClick={goToNextQuestion}>
            {questionIndex === interview.questions.length - 1 ? 'View results' : 'Next question'}
          </button>}
        </div>
      </div>
    </div>
  );
}
