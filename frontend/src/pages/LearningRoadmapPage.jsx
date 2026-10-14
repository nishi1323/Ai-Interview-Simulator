import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRoadmap } from '../services/api';

export default function LearningRoadmapPage() {
  const [items, setItems] = useState([]);
  const [completedDays, setCompletedDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getRoadmap()
      .then(({ data }) => {
        setItems(data);
        const account = JSON.parse(localStorage.getItem('aiInterviewUser') || '{}');
        const interviewId = data[0]?.interviewId || 'none';
        const storageKey = `learningPlan:${account.email || 'account'}:${interviewId}`;
        try {
          setCompletedDays(JSON.parse(localStorage.getItem(storageKey) || '[]'));
        } catch {
          setCompletedDays([]);
        }
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load your personalized learning plan.'))
      .finally(() => setLoading(false));
  }, []);

  const toggleDay = (day) => {
    const account = JSON.parse(localStorage.getItem('aiInterviewUser') || '{}');
    const interviewId = items[0]?.interviewId || 'none';
    const storageKey = `learningPlan:${account.email || 'account'}:${interviewId}`;
    setCompletedDays((current) => {
      const next = current.includes(day) ? current.filter((item) => item !== day) : [...current, day];
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const progressPercent = items.length ? Math.round((completedDays.length / items.length) * 100) : 0;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Targeted Study Plan</span>
          <h2>Personalized Improvement Roadmap</h2>
          <p style={{ margin: '6px 0 0' }}>Daily structured curriculum addressing specific concepts missed in previous interviews.</p>
        </div>
      </header>

      <div className="card panel roadmap-list">
        {loading && <p>Generating curriculum from previous evaluations…</p>}
        {error && <p className="alert error" role="alert">{error}</p>}

        {!loading && !error && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <p>Complete a mock interview to generate an actionable, personalized improvement curriculum.</p>
            <Link className="primary-btn" to="/interview-config" style={{ marginTop: '12px' }}>
              Start an Interview
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '14px', borderBottom: '1px solid var(--border-subtle)' }}>
            <div className="row-between">
              <strong style={{ color: '#fff', fontSize: '0.94rem' }}>
                Curriculum Completion: {completedDays.length} of {items.length} modules complete
              </strong>
              <span className="badge badge-success">{progressPercent}%</span>
            </div>
            <div className="progress" style={{ height: '8px' }}>
              <span className="green" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}

        {items.map(({ day, topic, task, baselineScore, targetRole, focus, challengeId }) => (
          <article key={day} className={`roadmap-item ${completedDays.includes(day) ? 'completed' : ''}`}>
            <label className="roadmap-check">
              <input
                type="checkbox"
                checked={completedDays.includes(day)}
                onChange={() => toggleDay(day)}
                aria-label={`Mark day ${day} complete`}
              />
              <span className="badge badge-primary">Day {day}</span>
            </label>

            <div className="roadmap-content">
              <div className="row-between">
                <strong style={{ color: '#fff', fontSize: '1.05rem' }}>{topic}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  {focus} · Baseline Score: {baselineScore}/100
                </span>
              </div>
              <p style={{ margin: '4px 0 6px', fontSize: '0.94rem' }}>{task}</p>
              <div className="row-between">
                <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>Target Track: {targetRole}</span>
                {challengeId && (
                  <Link to={`/coding-interview?challenge=${challengeId}`}>
                    Practice interactive sandbox challenge →
                  </Link>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
