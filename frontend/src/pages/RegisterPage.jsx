import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', experienceLevel: 'Fresher' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await registerUser(form);
      login(response.data.token, { name: response.data.name, email: response.data.email });
      navigate('/dashboard');
    } catch (err) {
      const serverMessage = err.response?.data?.message || err.response?.data?.detail;
      setError(
        serverMessage || (err.response?.status === 409
          ? 'That email already has an account. Sign in instead.'
          : 'Unable to register right now. Please verify all fields and try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div className="brand-icon">AI</div>
          <div>
            <strong style={{ display: 'block', fontSize: '1.1rem', color: '#fff' }}>Interview AI</strong>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Simulator Pro</span>
          </div>
        </div>

        <h2>Create Account</h2>
        <p>Start preparing with realistic AI mock interviews and resume intelligence.</p>

        {error && <div className="alert error" role="alert">{error}</div>}

        <form onSubmit={onSubmit} className="stack-form">
          <label>
            Full Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Alex Smith"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </label>

          <label>
            Email Address
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="candidate@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              minLength={6}
              maxLength={120}
              required
            />
          </label>

          <label>
            Phone Number (Optional)
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
              maxLength={30}
            />
          </label>

          <label>
            Current Experience Level
            <select
              value={form.experienceLevel}
              onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}
            >
              <option value="Fresher">Fresher / Graduate</option>
              <option value="1-2 years">1-2 years (Junior)</option>
              <option value="3-5 years">3-5 years (Mid-Level)</option>
              <option value="5+ years">5+ years (Senior / Staff)</option>
            </select>
          </label>

          <button className="primary-btn" type="submit" disabled={submitting} style={{ marginTop: '8px' }}>
            {submitting ? 'Creating Candidate Account…' : 'Register Free Account'}
          </button>
        </form>

        <div className="switch-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
