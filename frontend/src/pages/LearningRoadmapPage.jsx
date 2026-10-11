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
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load your learning plan.'))
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

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="eyebrow">Personalized roadmap</span>
          <h2>Improvement plan</h2>
        </div>
      </div>

      <div className="card panel roadmap-list">
        {loading && <p>Building your plan…</p>}
        {error && <p className="alert error" role="alert">{error}</p>}
        {!loading && !error && items.length === 0 && (
          <p>Complete an interview to get a focused learning plan. <Link to="/interview-config">Start an interview</Link>.</p>
        )}
        {items.length > 0 && (
          <div className="roadmap-progress">
            <span>{completedDays.length} of {items.length} actions complete</span>
            <div className="progress"><span style={{ width: `${completedDays.length * 100 / items.length}%` }} /></div>
          </div>
        )}
        {items.map(({ day, topic, task, baselineScore, targetRole, focus, challengeId }) => (
          <article key={day} className={`roadmap-item ${completedDays.includes(day) ? 'completed' : ''}`}>
            <label className="roadmap-check">
              <input type="checkbox" checked={completedDays.includes(day)} onChange={() => toggleDay(day)} aria-label={`Mark day ${day} complete`} />
              <strong>Day {day}</strong>
            </label>
            <div className="roadmap-content">
              <div className="roadmap-item-heading">
                <span>{topic}</span>
                <small>{focus} · Latest score {baselineScore}/100</small>
              </div>
              <p>{task}</p>
              <small>Target role: {targetRole}</small>
              {challengeId && <Link to={`/coding-interview?challenge=${challengeId}`}>Practice related challenge</Link>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
