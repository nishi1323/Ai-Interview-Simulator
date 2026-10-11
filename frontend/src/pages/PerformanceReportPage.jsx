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
  const data = completed.slice(-8).map((interview, index) => ({
    name: new Date(interview.completedAt || interview.createdAt).toLocaleDateString(),
    score: interview.overallScore,
    interview: index + 1,
  }));

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="eyebrow">Performance analytics</span>
          <h2>Interview performance report</h2>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card card"><small>Technical Score</small><strong>{loading ? '…' : average((interview) => interview.technicalScore)}</strong></div>
        <div className="stat-card card"><small>Communication Score</small><strong>{loading ? '…' : average((interview) => interview.communicationScore)}</strong></div>
        <div className="stat-card card"><small>Average Score</small><strong>{loading ? '…' : average((interview) => interview.overallScore)}</strong></div>
      </div>

      <div className="card panel">
        <h3>Trend over time</h3>
        {error && <p className="alert error" role="alert">{error}</p>}
        {loading && <p>Loading performance data…</p>}
        {!loading && !error && data.length === 0 && (
          <p>Complete an interview to see your score trend. <Link to="/interview-config">Start an interview</Link>.</p>
        )}
        {!loading && !error && data.length > 0 && (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#9db0d7" />
                <YAxis stroke="#9db0d7" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#4f8cff" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
