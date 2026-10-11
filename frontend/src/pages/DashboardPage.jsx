import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInterviews } from '../services/api';

export default function DashboardPage() {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getInterviews()
      .then(({ data }) => {
        if (active) setInterviews(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load your interview data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const completedInterviews = interviews.filter((interview) => interview.status === 'COMPLETED');
  const scores = completedInterviews.map((interview) => interview.overallScore).filter(Number.isFinite);
  const averageScore = scores.length ? `${Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)}%` : '—';
  const bestScore = scores.length ? `${Math.max(...scores)}%` : '—';
  const recentInterviews = interviews.slice(0, 4);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'there';
  const stats = [
    { label: 'Total Interviews', value: loading ? '…' : interviews.length },
    { label: 'Average Score', value: loading ? '…' : averageScore },
    { label: 'Best Score', value: loading ? '…' : bestScore },
    { label: 'In Progress', value: loading ? '…' : interviews.filter((interview) => interview.status !== 'COMPLETED').length },
  ];

  return (
    <div className="dashboard-page">
      <main className="content-area">
        <header className="page-header">
          <div>
            <span className="eyebrow">Candidate dashboard</span>
            <h2>Welcome back, {firstName}</h2>
          </div>
          <Link className="primary-btn" to="/interview-config">Start interview</Link>
        </header>

        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card card">
              <small>{stat.label}</small>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        <div className="two-column">
          <div className="card panel">
            <h3>Recent interview scores</h3>
            {error && <p className="alert error" role="alert">{error}</p>}
            {!loading && !error && recentInterviews.length === 0 && <p>No interviews yet. Start a practice session to see your progress.</p>}
            <div className="progress-stack">
              {recentInterviews.map((interview) => (
                <div key={interview.id}>
                  <div><span>Interview #{interview.id}</span><strong>{interview.overallScore == null ? 'In progress' : `${interview.overallScore}%`}</strong></div>
                  <div className="progress"><span style={{ width: `${interview.overallScore ?? 0}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card panel">
            <h3>Recent interviews</h3>
            {error && <p className="alert error" role="alert">{error}</p>}
            {!loading && !error && recentInterviews.length === 0 && <p>Your interview history will appear here.</p>}
            <ul className="list-view">
              {recentInterviews.slice(0, 3).map((interview) => (
                <li key={interview.id}>
                  <Link to={interview.status === 'COMPLETED' ? `/result/${interview.id}` : `/interview-room/${interview.id}`}>
                    {interview.jobRole || `Interview #${interview.id}`} · {interview.interviewType} · {interview.overallScore == null ? interview.status : `${interview.overallScore}%`}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
