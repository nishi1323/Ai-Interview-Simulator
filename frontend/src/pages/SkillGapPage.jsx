import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSkillGaps } from '../services/api';

export default function SkillGapPage() {
  const [gaps, setGaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSkillGaps()
      .then(({ data }) => setGaps(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load skill gaps.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="eyebrow">Skill gap analysis</span>
          <h2>Weak areas and priorities</h2>
        </div>
      </div>

      <div className="card panel">
        {loading && <p>Loading skill analysis…</p>}
        {error && <p className="alert error" role="alert">{error}</p>}
        {!loading && !error && gaps.length === 0 && (
          <p>Complete an interview to identify improvement areas. <Link to="/interview-config">Start an interview</Link>.</p>
        )}
        {gaps.map(({ skill, score, gapPercent }) => (
          <div key={skill} className="gap-row">
            <div className="gap-label"><span>{skill}</span><strong>{gapPercent}% gap</strong></div>
            <div className="progress"><span style={{ width: `${gapPercent}%` }} /></div>
            <small>Latest score: {score}/100</small>
          </div>
        ))}
      </div>
    </div>
  );
}
