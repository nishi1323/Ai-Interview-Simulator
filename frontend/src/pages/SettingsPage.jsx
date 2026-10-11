import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCurrentUser, updateCurrentUser } from '../services/api';

export default function SettingsPage() {
  const { updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', experienceLevel: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(({ data }) => {
        if (active) setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          experienceLevel: data.experienceLevel || 'Fresher',
        });
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load account settings.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await updateCurrentUser({
        name: form.name,
        phone: form.phone,
        experienceLevel: form.experienceLevel,
      });
      updateUser(data);
      setMessage('Profile updated.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="eyebrow">Settings</span>
          <h2>Account preferences</h2>
        </div>
      </div>

      {loading && <p>Loading account settings…</p>}
      {error && <p className="alert error" role="alert">{error}</p>}
      {message && <p className="alert info" role="status">{message}</p>}
      {!loading && !error && (
        <form className="card panel stack-form settings-form" onSubmit={saveSettings}>
          <label>Full name<input name="name" value={form.name} onChange={updateField} required minLength={2} maxLength={80} /></label>
          <label>Email<input name="email" type="email" value={form.email} readOnly /></label>
          <label>Phone<input name="phone" type="tel" value={form.phone} onChange={updateField} maxLength={30} /></label>
          <label>Experience level
            <select name="experienceLevel" value={form.experienceLevel} onChange={updateField}>
              <option>Fresher</option><option>1-2 years</option><option>3-5 years</option><option>5+ years</option>
            </select>
          </label>
          <button className="primary-btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
        </form>
      )}
    </div>
  );
}
