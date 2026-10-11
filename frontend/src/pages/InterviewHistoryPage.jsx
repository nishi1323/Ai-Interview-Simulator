import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInterviews } from '../services/api';

export default function InterviewHistoryPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getInterviews()
      .then(({ data }) => setInterviews(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load interview history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="eyebrow">History</span>
          <h2>Interview history</h2>
        </div>
      </div>

      <div className="card panel history-list">
        {loading && <p>Loading interviews…</p>}
        {error && <p className="alert error" role="alert">{error}</p>}
        {!loading && !error && interviews.length === 0 && <p>No interviews yet. Start with a <Link to="/interview-config">new interview</Link>.</p>}
        {interviews.map((interview) => (
          <Link
            key={interview.id}
            to={interview.status === 'COMPLETED' ? `/result/${interview.id}` : `/interview-room/${interview.id}`}
            className="history-row"
          >
            <div>
              <strong>Interview #{interview.id}</strong>
              <p>{interview.jobRole || interview.interviewType} · {interview.interviewType} · {interview.difficulty} · {interview.totalQuestions} questions</p>
            </div>
            <span>{interview.overallScore == null ? interview.status : `${interview.overallScore}%`}</span>
            <small>{new Date(interview.createdAt).toLocaleDateString()}</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
