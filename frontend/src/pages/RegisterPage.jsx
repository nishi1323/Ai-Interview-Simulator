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
      setError(serverMessage || (err.response?.status === 409
        ? 'That email already has an account. Sign in instead.'
        : 'Unable to register right now. Please check the fields and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <h2>Create account</h2>
        <p>Start preparing for interviews with AI-guided practice.</p>
        {error && <div className="alert error" role="alert">{error}</div>}
        <form onSubmit={onSubmit} className="stack-form">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" autoComplete="name" minLength={2} maxLength={80} required />
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" autoComplete="email" required />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password (at least 6 characters)" autoComplete="new-password" minLength={6} maxLength={120} required />
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone (optional)" autoComplete="tel" maxLength={30} />
          <select value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
            <option>Fresher</option>
            <option>1-2 years</option>
            <option>3-5 years</option>
            <option>5+ years</option>
          </select>
          <button className="primary-btn" type="submit" disabled={submitting}>{submitting ? 'Creating account…' : 'Register'}</button>
        </form>
        <div className="switch-link">Already have an account? <Link to="/login">Login</Link></div>
      </div>
    </div>
  );
}
