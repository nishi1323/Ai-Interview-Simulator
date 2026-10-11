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

  if (error) return <main className="page-shell"><p className="alert error">{error}</p><Link to="/history">Back to history</Link></main>;
  if (!interview) return <main className="page-shell"><p>Loading results…</p></main>;

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="eyebrow">Final interview report</span>
          <h2>Overall Score: {interview.overallScore ?? 0}/100</h2>
        </div>
      </div>

      <div className="score-grid">
        {[
          ['Technical', interview.technicalScore],
          ['Communication', interview.communicationScore],
          ['Relevance', interview.relevanceScore],
          ['Problem Solving', interview.problemSolvingScore],
          ['Delivery', interview.deliveryScore],
        ].map(([label, value]) => (
          <div key={label} className="score-card card">
            <small>{label}</small>
            <strong>{value ?? '—'}</strong>
          </div>
        ))}
      </div>

      <div className="card panel">
        <h3>{interview.status === 'COMPLETED' ? 'Interview completed' : 'Interview in progress'}</h3>
        <p>{interview.jobRole ? `${interview.jobRole} · ` : ''}{interview.interviewType} · {interview.difficulty} · {interview.totalQuestions} questions</p>
        <Link className="secondary-btn" to="/history">Back to interview history</Link>
      </div>
    </div>
  );
}
