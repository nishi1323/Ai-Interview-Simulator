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
  const recentInterviews = interviews.slice(0, 5);
  const firstName = user?.name?.trim().split(/\s+/)[0] || 'Candidate';

  const getScoreColorClass = (score) => {
    if (score == null) return '';
    if (score >= 75) return 'green';
    if (score >= 50) return 'amber';
    return 'red';
  };

  const stats = [
    {
      label: 'Total Sessions',
      value: loading ? '…' : interviews.length,
      subtext: 'Completed & in-progress',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      label: 'Average Score',
      value: loading ? '…' : averageScore,
      subtext: 'Across all completed',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
    {
      label: 'Best Score',
      value: loading ? '…' : bestScore,
      subtext: 'Highest evaluation',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
    {
      label: 'In Progress',
      value: loading ? '…' : interviews.filter((interview) => interview.status !== 'COMPLETED').length,
      subtext: 'Ready to continue',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="page-shell">
      {/* Page Header */}
      <header className="page-header">
        <div>
          <span className="eyebrow">Candidate Overview</span>
          <h2>Welcome back, {firstName} 👋</h2>
          <p style={{ margin: '6px 0 0' }}>Here is an overview of your interview readiness and recent practice sessions.</p>
        </div>
        <Link className="primary-btn" to="/interview-config">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Start New Interview
        </Link>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card card">
            <div className="row-between" style={{ color: 'var(--accent)' }}>
              <small>{stat.label}</small>
              {stat.icon}
            </div>
            <strong>{stat.value}</strong>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{stat.subtext}</span>
          </div>
        ))}
      </section>

      {/* Main Two-Column Layout */}
      <div className="two-column">
        {/* Left Column: Recent Score Progress */}
        <section className="card panel">
          <div className="row-between">
            <h3>Recent Interview Scores</h3>
            <Link to="/report" style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600 }}>
              Full report →
            </Link>
          </div>

          {error && <p className="alert error" role="alert">{error}</p>}
          {!loading && !error && recentInterviews.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p>No interview data yet. Start your first mock interview to track progress.</p>
              <Link className="primary-btn" to="/interview-config" style={{ marginTop: '12px' }}>
                Launch First Session
              </Link>
            </div>
          )}

          <div className="progress-stack">
            {recentInterviews.map((interview) => {
              const score = interview.overallScore;
              const colorClass = getScoreColorClass(score);
              return (
                <div key={interview.id}>
                  <div className="progress-header">
                    <div>
                      <strong style={{ color: '#fff' }}>{interview.jobRole || `Interview #${interview.id}`}</strong>
                      <span style={{ marginLeft: '8px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {interview.interviewType} · {interview.difficulty}
                      </span>
                    </div>
                    <strong>{score == null ? 'In progress' : `${score}%`}</strong>
                  </div>
                  <div className="progress">
                    <span
                      className={colorClass}
                      style={{ width: `${score ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Quick Actions & Recent Activity */}
        <section className="card panel">
          <h3>Quick Practice Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', marginTop: '14px' }}>
            <Link to="/voice-interview" className="secondary-btn" style={{ justifyContent: 'flex-start', padding: '12px 14px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
              <span>Voice Pacing & Delivery Practice</span>
            </Link>

            <Link to="/coding-interview" className="secondary-btn" style={{ justifyContent: 'flex-start', padding: '12px 14px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}>
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>Coding Sandbox & Algorithm Tests</span>
            </Link>

            <Link to="/assistant" className="secondary-btn" style={{ justifyContent: 'flex-start', padding: '12px 14px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--emerald)' }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              <span>Ask AI Career Coach for Guidance</span>
            </Link>
          </div>

          <h4 style={{ margin: '22px 0 8px', fontSize: '0.92rem', color: 'var(--text-muted)' }}>Recent Interviews</h4>
          <ul className="list-view">
            {recentInterviews.slice(0, 3).map((interview) => (
              <li key={interview.id}>
                <Link to={interview.status === 'COMPLETED' ? `/result/${interview.id}` : `/interview-room/${interview.id}`}>
                  <span>{interview.jobRole || `Interview #${interview.id}`}</span>
                  <span className={`badge ${interview.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                    {interview.overallScore == null ? interview.status : `${interview.overallScore}%`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
