import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(
    searchParams.get('reason') === 'session-expired'
      ? 'Your session expired. Please sign in again.'
      : ''
  );
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const response = await loginUser(form);
      login(response.data.token, { name: response.data.name, email: response.data.email });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid email or password. Please verify your credentials.');
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

        <h2>Welcome back</h2>
        <p>Sign in to continue your mock interview simulations.</p>

        {error && <div className="alert error" role="alert">{error}</div>}

        <form onSubmit={onSubmit} className="stack-form">
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
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button className="primary-btn" type="submit" disabled={submitting} style={{ marginTop: '8px' }}>
            {submitting ? 'Signing in…' : 'Sign in to Account'}
          </button>
        </form>

        <div className="switch-link">
          Don&apos;t have an account yet? <Link to="/register">Create an account free</Link>
        </div>
      </div>
    </div>
  );
}
