import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(searchParams.get('reason') === 'session-expired' ? 'Your demo session expired. Sign in again.' : '');

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await loginUser(form);
      login(response.data.token, { name: response.data.name, email: response.data.email });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid email or password.');
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <h2>Welcome back</h2>
        <p>Sign in to continue your mock interview journey.</p>
        {error && <div className="alert error" role="alert">{error}</div>}
        <form onSubmit={onSubmit} className="stack-form">
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" autoComplete="email" required />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" autoComplete="current-password" required />
          <button className="primary-btn" type="submit">Login</button>
        </form>
        <div className="switch-link">New here? <Link to="/register">Register</Link></div>
      </div>
    </div>
  );
}
