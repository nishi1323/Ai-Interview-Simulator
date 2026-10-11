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
        if (active) setError(requestError.response?.data?.message || 'Could not load your profile.');
      });
    return () => { active = false; };
  }, []);

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="eyebrow">Profile</span>
          <h2>Candidate profile</h2>
        </div>
      </div>

      {error && <p className="alert error" role="alert">{error}</p>}
      {!profile && !error && <p>Loading profile…</p>}
      {profile && (
        <div className="card panel profile-box">
          <div><strong>Name</strong><p>{profile.name}</p></div>
          <div><strong>Email</strong><p>{profile.email}</p></div>
          <div><strong>Phone</strong><p>{profile.phone || 'Not provided'}</p></div>
          <div><strong>Experience level</strong><p>{profile.experienceLevel || 'Not provided'}</p></div>
          <div><strong>Preferred role</strong><p>{localStorage.getItem('aiInterviewSelectedRole') || 'Not selected'}</p></div>
          <div><strong>Account</strong><p>Created {new Date(profile.createdAt).toLocaleDateString()}</p></div>
          <Link className="secondary-btn" to="/settings">Edit profile</Link>
        </div>
      )}
    </div>
  );
}
