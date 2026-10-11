import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { matchJobRole } from '../services/api';

const roles = ['Java Developer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'Software Engineer', 'Data Analyst'];

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
      setError(requestError.response?.data?.message || 'Could not compare your resume to this role.');
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="eyebrow">Role selection</span>
          <h2>Select target job role</h2>
        </div>
      </div>

      <div className="card panel">
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
        <form onSubmit={compareResume}>
          <textarea
            rows="6"
            maxLength={12000}
            placeholder="Paste the job description to compare its skills with your latest resume."
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
          />
          <div className="row-between">
            <small>{jobDescription.length}/12000</small>
            <button className="secondary-btn" type="submit" disabled={matching || !jobDescription.trim()}>
              {matching ? 'Comparing…' : 'Compare with resume'}
            </button>
          </div>
        </form>
        {error && <p className="alert error" role="alert">{error} {needsResume && <Link to="/resume-upload">Upload resume</Link>}</p>}
        {match && (
          <div className="report-box" role="status">
            <strong>{match.matchPercent}% skill match · {match.jobRole}</strong>
            <p>Resume: {match.resumeFilename}</p>
            <p>Matching skills: {match.matchingSkills.length ? match.matchingSkills.join(', ') : 'None found'}</p>
            <p>Missing skills: {match.missingSkills.length ? match.missingSkills.join(', ') : 'None identified'}</p>
          </div>
        )}
        <div className="row-between">
          <strong>{selectedRole}</strong>
          <button className="primary-btn" type="button" onClick={continueToSetup}>Continue to setup</button>
        </div>
      </div>
    </div>
  );
}
