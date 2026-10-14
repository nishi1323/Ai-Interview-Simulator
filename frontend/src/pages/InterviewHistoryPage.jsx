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
      <header className="page-header">
        <div>
          <span className="eyebrow">Session Archives</span>
          <h2>Interview History</h2>
          <p style={{ margin: '6px 0 0' }}>Review past mock interview evaluations, scores, and resume progress.</p>
        </div>
        <Link className="primary-btn" to="/interview-config">
          Start New Interview
        </Link>
      </header>

      <div className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading && <p>Loading past interviews…</p>}
        {error && <p className="alert error" role="alert">{error}</p>}

        {!loading && !error && interviews.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <p>No previous interviews found. Launch your first mock session to start tracking performance.</p>
            <Link className="primary-btn" to="/interview-config" style={{ marginTop: '12px' }}>
              Launch First Interview
            </Link>
          </div>
        )}

        {interviews.map((interview) => {
          const isCompleted = interview.status === 'COMPLETED';
          return (
            <Link
              key={interview.id}
              to={isCompleted ? `/result/${interview.id}` : `/interview-room/${interview.id}`}
              className="history-row"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: isCompleted ? 'var(--emerald)' : 'var(--warning)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  #{interview.id}
                </div>
                <div>
                  <strong style={{ color: '#fff', fontSize: '1rem' }}>
                    {interview.jobRole || 'General Practice'}
                  </strong>
                  <p style={{ margin: '3px 0 0', color: 'var(--text-dim)', fontSize: '0.84rem' }}>
                    {interview.interviewType} · {interview.difficulty} · {interview.totalQuestions} questions
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span className={`badge ${isCompleted ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.88rem', padding: '4px 12px' }}>
                  {interview.overallScore == null ? 'In Progress' : `${interview.overallScore}%`}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                  {new Date(interview.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
