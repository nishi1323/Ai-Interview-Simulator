import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../services/api';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then(({ data }) => {
        if (active) setProfile(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load your profile details.');
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Candidate Account</span>
          <h2>Candidate Profile</h2>
          <p style={{ margin: '6px 0 0' }}>Your verified candidate credentials, contact information, and target career track.</p>
        </div>
        <Link className="secondary-btn" to="/settings">Edit Profile</Link>
      </header>

      {error && <p className="alert error" role="alert">{error}</p>}
      {!profile && !error && <p>Loading candidate profile information…</p>}

      {profile && (
        <div className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div className="user-avatar" style={{ width: '64px', height: '64px', fontSize: '1.6rem' }}>
              {(profile.name || profile.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem', color: '#fff' }}>{profile.name}</h3>
              <span style={{ color: 'var(--accent)', fontSize: '0.88rem' }}>{profile.email}</span>
            </div>
          </div>

          <div className="profile-box" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
            <div className="profile-item">
              <strong>Full Name</strong>
              <p>{profile.name}</p>
            </div>
            <div className="profile-item">
              <strong>Email Address</strong>
              <p>{profile.email}</p>
            </div>
            <div className="profile-item">
              <strong>Phone Number</strong>
              <p>{profile.phone || 'Not provided'}</p>
            </div>
            <div className="profile-item">
              <strong>Experience Level</strong>
              <p>{profile.experienceLevel || 'Fresher'}</p>
            </div>
            <div className="profile-item">
              <strong>Target Engineering Role</strong>
              <p>{localStorage.getItem('aiInterviewSelectedRole') || 'Java Developer'}</p>
            </div>
            <div className="profile-item">
              <strong>Member Since</strong>
              <p>{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' }) : 'Active Candidate'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
