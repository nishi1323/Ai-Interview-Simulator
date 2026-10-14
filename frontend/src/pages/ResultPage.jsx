import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getInterviewDetails } from '../services/api';

export default function ResultPage() {
  const { interviewId } = useParams();
  const [interview, setInterview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getInterviewDetails(interviewId)
      .then(({ data }) => setInterview(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Could not load interview results.'));
  }, [interviewId]);

  if (error) {
    return (
      <main className="page-shell">
        <p className="alert error" role="alert">{error}</p>
        <Link className="primary-btn" to="/history">Back to Interview History</Link>
      </main>
    );
  }

  if (!interview) {
    return (
      <main className="page-shell" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p>Loading your final interview evaluation…</p>
      </main>
    );
  }

  const scoreCategories = [
    { label: 'Technical Depth', value: interview.technicalScore },
    { label: 'Communication', value: interview.communicationScore },
    { label: 'Relevance', value: interview.relevanceScore },
    { label: 'Problem Solving', value: interview.problemSolvingScore },
    { label: 'Delivery & Confidence', value: interview.deliveryScore },
  ];

  const overall = interview.overallScore ?? 0;

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Evaluation Summary</span>
          <h2>Interview Performance Results</h2>
          <p style={{ margin: '6px 0 0' }}>
            {interview.jobRole} · {interview.interviewType} · {interview.difficulty}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link className="secondary-btn" to="/history">All History</Link>
          <Link className="primary-btn" to="/interview-config">Start New Session</Link>
        </div>
      </header>

      {/* Hero Score Card */}
      <div className="card panel" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
        <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '2rem', color: '#fff', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)', flexShrink: 0 }}>
          {overall}%
        </div>
        <div>
          <span className="badge badge-success" style={{ marginBottom: '6px' }}>Evaluation Complete</span>
          <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>
            Overall Score: {overall}/100
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: '0.94rem' }}>
            {overall >= 80
              ? 'Outstanding performance! You demonstrated deep technical comprehension and clear communication.'
              : overall >= 60
              ? 'Solid demonstration of core concepts. Check the skill gap breakdown below to polish specific areas.'
              : 'Keep practicing! Review recommended coding challenges and your learning roadmap to build mastery.'}
          </p>
        </div>
      </div>

      {/* Granular Score Breakdown Grid */}
      <div className="score-grid">
        {scoreCategories.map(({ label, value }) => (
          <div key={label} className="score-card card">
            <small>{label}</small>
            <strong>{value != null ? `${value}%` : '—'}</strong>
            <div className="progress" style={{ height: '6px', marginTop: '4px' }}>
              <span style={{ width: `${value ?? 0}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Next Step Recommendations */}
      <div className="two-column">
        <div className="card panel">
          <h3>Targeted Improvements</h3>
          <p>We’ve analyzed your answers and generated a personalized learning roadmap.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
            <Link className="primary-btn" to="/roadmap">View Learning Roadmap</Link>
            <Link className="secondary-btn" to="/skill-gaps">Review Skill Gaps</Link>
          </div>
        </div>

        <div className="card panel">
          <h3>Coding Practice</h3>
          <p>Reinforce your problem-solving skills with algorithm challenges tailored to this session.</p>
          <Link className="secondary-btn" to="/coding-interview" style={{ marginTop: '14px' }}>
            Open Coding Sandbox
          </Link>
        </div>
      </div>
    </div>
  );
}
