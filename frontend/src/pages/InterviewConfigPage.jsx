import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInterview } from '../services/api';

const roleOptions = [
  'Java Developer',
  'Full Stack Developer',
  'Backend Developer',
  'Frontend Developer',
  'Software Engineer',
  'Data Analyst',
];

export default function InterviewConfigPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    jobRole: localStorage.getItem('aiInterviewSelectedRole') || 'Java Developer',
    interviewType: 'Technical',
    difficulty: 'Intermediate',
    totalQuestions: 5,
    mode: 'Text',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    if (name === 'jobRole') localStorage.setItem('aiInterviewSelectedRole', value);
    setForm((current) => ({ ...current, [name]: name === 'totalQuestions' ? Number(value) : value }));
  };

  const startInterview = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await createInterview(form);
      navigate(`/interview-room/${response.data.id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not configure and start your interview. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Simulation Setup</span>
          <h2>Configure Mock Interview</h2>
          <p style={{ margin: '6px 0 0' }}>Select your target engineering role, difficulty, format, and number of questions to begin.</p>
        </div>
      </header>

      <form className="card panel form-grid" onSubmit={startInterview} style={{ maxWidth: '820px' }}>
        <label>
          Target Job Role
          <select name="jobRole" value={form.jobRole} onChange={updateField}>
            {roleOptions.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </label>

        <label>
          Interview Type
          <select name="interviewType" value={form.interviewType} onChange={updateField}>
            <option value="Technical">Technical (Architecture & Coding)</option>
            <option value="HR">HR & Cultural Fit</option>
            <option value="Behavioral">Behavioral (STAR Method)</option>
            <option value="Mixed">Mixed Comprehensive</option>
          </select>
        </label>

        <label>
          Experience & Difficulty
          <select name="difficulty" value={form.difficulty} onChange={updateField}>
            <option value="Beginner">Entry Level / Junior</option>
            <option value="Intermediate">Mid-Level / Intermediate</option>
            <option value="Advanced">Senior / Staff / Lead</option>
          </select>
        </label>

        <label>
          Question Count
          <select name="totalQuestions" value={form.totalQuestions} onChange={updateField}>
            <option value={5}>5 Questions (~10 mins)</option>
            <option value={10}>10 Questions (~20 mins)</option>
            <option value={15}>15 Questions (~30 mins)</option>
          </select>
        </label>

        <label style={{ gridColumn: 'span 2' }}>
          Response Format
          <select name="mode" value={form.mode} onChange={updateField}>
            <option value="Text">Written / Keyboard Mode</option>
            <option value="Voice">Spoken / Voice Mode</option>
          </select>
        </label>

        {error && (
          <div style={{ gridColumn: 'span 2' }}>
            <p className="alert error" role="alert">{error}</p>
          </div>
        )}

        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? (
            'Generating Tailored Questions…'
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              Start Mock Interview
            </>
          )}
        </button>
      </form>
    </div>
  );
}
