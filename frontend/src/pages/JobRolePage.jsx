import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { matchJobRole } from '../services/api';

const roles = [
  'Java Developer',
  'Full Stack Developer',
  'Backend Developer',
  'Frontend Developer',
  'Software Engineer',
  'Data Analyst',
];

export default function JobRolePage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem('aiInterviewSelectedRole') || roles[0]);
  const [jobDescription, setJobDescription] = useState('');
  const [match, setMatch] = useState(null);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState('');
  const [needsResume, setNeedsResume] = useState(false);

  const continueToSetup = () => {
    localStorage.setItem('aiInterviewSelectedRole', selectedRole);
    navigate('/interview-config');
  };

  const compareResume = async (event) => {
    event.preventDefault();
    setError('');
    setNeedsResume(false);
    setMatch(null);
    setMatching(true);
    try {
      const { data } = await matchJobRole({ jobRole: selectedRole, jobDescription });
      setMatch(data);
    } catch (requestError) {
      setNeedsResume(requestError.response?.status === 404);
      setError(requestError.response?.data?.message || 'Could not benchmark your resume against this role.');
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Role & Requirement Benchmark</span>
          <h2>Select Target Engineering Role</h2>
          <p style={{ margin: '6px 0 0' }}>Select your target role and optionally paste a job description to calculate skill match percentage against your resume.</p>
        </div>
      </header>

      <div className="card panel">
        <span className="eyebrow">Choose Primary Track</span>
        <div className="role-grid">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              className="role-chip"
              aria-pressed={selectedRole === role}
              onClick={() => {
                setSelectedRole(role);
                localStorage.setItem('aiInterviewSelectedRole', role);
                setMatch(null);
              }}
            >
              {role}
            </button>
          ))}
        </div>

        <form onSubmit={compareResume} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label htmlFor="jd-textarea" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            Paste Job Description (Optional)
          </label>
          <textarea
            id="jd-textarea"
            rows={6}
            maxLength={12000}
            placeholder="Paste the target job description or requirements here to match required skills with your extracted resume..."
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
          />
          <div className="row-between">
            <small style={{ color: 'var(--text-dim)' }}>{jobDescription.length}/12000 characters</small>
            <button className="secondary-btn" type="submit" disabled={matching || !jobDescription.trim()}>
              {matching ? 'Comparing Requirements…' : 'Compare with Resume Skills'}
            </button>
          </div>
        </form>

        {error && (
          <p className="alert error" role="alert">
            {error}{' '}
            {needsResume && (
              <Link to="/resume-upload" style={{ textDecoration: 'underline', fontWeight: 600, marginLeft: '6px' }}>
                Upload Resume First
              </Link>
            )}
          </p>
        )}

        {match && (
          <div className="report-box" role="status">
            <div className="row-between">
              <strong style={{ fontSize: '1.15rem' }}>
                {match.matchPercent}% Match Readiness for {match.jobRole}
              </strong>
              <span className="badge badge-primary">{match.resumeFilename}</span>
            </div>
            <div className="progress" style={{ height: '8px', margin: '4px 0' }}>
              <span style={{ width: `${match.matchPercent}%` }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', marginTop: '10px' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--emerald)' }}>✓ Matching Skills</strong>
                <div className="tag-row" style={{ marginTop: '6px' }}>
                  {match.matchingSkills.length
                    ? match.matchingSkills.map((s) => <span key={s} className="tag">{s}</span>)
                    : <p style={{ margin: 0, fontSize: '0.85rem' }}>None identified</p>}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>✗ Missing or Unverified Skills</strong>
                <div className="tag-row" style={{ marginTop: '6px' }}>
                  {match.missingSkills.length
                    ? match.missingSkills.map((s) => <span key={s} className="tag" style={{ borderColor: 'rgba(239, 68, 68, 0.4)' }}>{s}</span>)
                    : <p style={{ margin: 0, fontSize: '0.85rem' }}>None missing</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row-between" style={{ marginTop: '24px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'block' }}>Selected Track</span>
            <strong style={{ color: '#fff', fontSize: '1.05rem' }}>{selectedRole}</strong>
          </div>
          <button className="primary-btn" type="button" onClick={continueToSetup}>
            Continue to Interview Setup →
          </button>
        </div>
      </div>
    </div>
  );
}
