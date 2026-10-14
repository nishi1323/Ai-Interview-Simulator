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
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load skill gap analysis.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Gap Identification</span>
          <h2>Skill Gap Priorities</h2>
          <p style={{ margin: '6px 0 0' }}>Prioritized list of technical concepts where previous answers scored below expected benchmarks.</p>
        </div>
        <Link className="secondary-btn" to="/roadmap">Open Learning Plan</Link>
      </header>

      <div className="card panel">
        {loading && <p>Analyzing question evaluation history…</p>}
        {error && <p className="alert error" role="alert">{error}</p>}

        {!loading && !error && gaps.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 0' }}>
            <p>Complete a mock interview to identify high-priority improvement areas.</p>
            <Link className="primary-btn" to="/interview-config" style={{ marginTop: '12px' }}>
              Start an Interview
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {gaps.map(({ skill, score, gapPercent }) => (
            <div key={skill} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className="row-between">
                <div>
                  <strong style={{ fontSize: '1.02rem', color: '#fff' }}>{skill}</strong>
                  <span style={{ marginLeft: '10px', fontSize: '0.82rem', color: 'var(--text-dim)' }}>
                    Latest Evaluation Score: {score}/100
                  </span>
                </div>
                <span className={`badge ${gapPercent >= 50 ? 'badge-danger' : 'badge-warning'}`}>
                  {gapPercent}% Gap Margin
                </span>
              </div>
              <div className="progress" style={{ height: '8px' }}>
                <span
                  className={gapPercent >= 50 ? 'red' : 'amber'}
                  style={{ width: `${gapPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
