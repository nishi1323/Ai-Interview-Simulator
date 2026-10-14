import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInterviews } from '../services/api';

export default function PerformanceReportPage() {
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
        if (active) setError(requestError.response?.data?.message || 'Could not load performance data.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const completed = interviews
    .filter((interview) => interview.status === 'COMPLETED' && Number.isFinite(interview.overallScore))
    .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt));

  const average = (selector) => {
    const values = completed.map(selector).filter(Number.isFinite);
    return values.length ? `${Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)}%` : '—';
  };

  const chartData = completed.slice(-10).map((interview, index) => ({
    name: new Date(interview.completedAt || interview.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    score: interview.overallScore,
    session: `Session #${index + 1}`,
  }));

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Analytics & Trends</span>
          <h2>Performance Analytics</h2>
          <p style={{ margin: '6px 0 0' }}>Track your interview evaluation scores, technical progression, and score trajectory over time.</p>
        </div>
      </header>

      {/* Metric Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="stat-card card">
          <small>Average Technical Score</small>
          <strong>{loading ? '…' : average((interview) => interview.technicalScore)}</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Across technical evaluations</span>
        </div>
        <div className="stat-card card">
          <small>Average Communication</small>
          <strong>{loading ? '…' : average((interview) => interview.communicationScore)}</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Structure, clarity, and articulation</span>
        </div>
        <div className="stat-card card">
          <small>Cumulative Score Average</small>
          <strong>{loading ? '…' : average((interview) => interview.overallScore)}</strong>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Overall mock interview mean</span>
        </div>
      </div>

      {/* Trend Chart Card */}
      <div className="card panel">
        <div className="row-between">
          <h3>Score Progression Trajectory</h3>
          <span className="badge badge-primary">{completed.length} Sessions Completed</span>
        </div>

        {error && <p className="alert error" role="alert">{error}</p>}
        {loading && <p>Loading historical performance metrics…</p>}

        {!loading && !error && chartData.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p>Complete at least one mock interview to view score trend lines.</p>
            <Link className="primary-btn" to="/interview-config" style={{ marginTop: '12px' }}>
              Start an Interview
            </Link>
          </div>
        )}

        {!loading && !error && chartData.length > 0 && (
          <div style={{ width: '100%', height: 280, marginTop: '18px' }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" domain={[0, 100]} fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0c1628',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', r: 5 }}
                  activeDot={{ r: 7, fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
