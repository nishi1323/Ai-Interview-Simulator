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
      setMessage('Profile settings saved successfully.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Account Settings</span>
          <h2>Candidate Preferences</h2>
          <p style={{ margin: '6px 0 0' }}>Update your profile name, contact phone, and professional experience level.</p>
        </div>
      </header>

      {loading && <p>Loading account preferences…</p>}
      {error && <p className="alert error" role="alert">{error}</p>}
      {message && <p className="alert success" role="status">{message}</p>}

      {!loading && !error && (
        <form className="card panel stack-form settings-form" onSubmit={saveSettings}>
          <label>
            Full Name
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              required
              minLength={2}
              maxLength={80}
            />
          </label>

          <label>
            Email Address (Primary Login)
            <input
              name="email"
              type="email"
              value={form.email}
              readOnly
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </label>

          <label>
            Phone Number (Optional)
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={updateField}
              maxLength={30}
              placeholder="+1 (555) 000-0000"
            />
          </label>

          <label>
            Experience Level
            <select name="experienceLevel" value={form.experienceLevel} onChange={updateField}>
              <option value="Fresher">Fresher / Graduate</option>
              <option value="1-2 years">1-2 years (Junior)</option>
              <option value="3-5 years">3-5 years (Mid-Level)</option>
              <option value="5+ years">5+ years (Senior / Staff)</option>
            </select>
          </label>

          <button className="primary-btn" type="submit" disabled={saving} style={{ alignSelf: 'flex-start', marginTop: '8px' }}>
            {saving ? 'Saving Preferences…' : 'Save Profile Changes'}
          </button>
        </form>
      )}
    </div>
  );
}
