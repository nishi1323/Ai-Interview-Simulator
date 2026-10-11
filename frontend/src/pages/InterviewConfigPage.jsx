import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInterview } from '../services/api';

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
      setError(requestError.response?.data?.message || 'Could not create your interview. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="eyebrow">Interview setup</span>
          <h2>Configure your next mock interview</h2>
        </div>
      </div>

      <form className="card panel form-grid" onSubmit={startInterview}>
        <label>
          Job role
          <select name="jobRole" value={form.jobRole} onChange={updateField}>
            <option>Java Developer</option><option>Full Stack Developer</option><option>Backend Developer</option><option>Frontend Developer</option><option>Software Engineer</option><option>Data Analyst</option>
          </select>
        </label>
        <label>
          Interview type
          <select name="interviewType" value={form.interviewType} onChange={updateField}>
            <option>Technical</option><option>HR</option><option>Behavioral</option><option>Mixed</option>
          </select>
        </label>
        <label>
          Difficulty
          <select name="difficulty" value={form.difficulty} onChange={updateField}>
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </label>
        <label>
          Questions
          <select name="totalQuestions" value={form.totalQuestions} onChange={updateField}>
            <option value={5}>5 Questions</option><option value={10}>10 Questions</option><option value={15}>15 Questions</option>
          </select>
        </label>
        <label>
          Mode
          <select name="mode" value={form.mode} onChange={updateField}>
            <option>Text</option><option>Voice</option>
          </select>
        </label>
        {error && <p className="alert error" role="alert">{error}</p>}
        <button className="primary-btn" type="submit" disabled={submitting}>
          {submitting ? 'Creating interview…' : 'Start interview'}
        </button>
      </form>
    </div>
  );
}
