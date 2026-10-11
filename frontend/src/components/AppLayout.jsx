import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navigation = [
  ['Dashboard', '/dashboard'],
  ['AI assistant', '/assistant'],
  ['Resume upload', '/resume-upload'],
  ['Resume analysis', '/resume-analysis'],
  ['Target role', '/job-role'],
  ['Interview setup', '/interview-config'],
  ['History', '/history'],
  ['Performance', '/report'],
  ['Skill gaps', '/skill-gaps'],
  ['Learning plan', '/roadmap'],
  ['Voice practice', '/voice-interview'],
  ['Coding practice', '/coding-interview'],
  ['Profile', '/profile'],
  ['Settings', '/settings'],
];

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const signOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-layout">
      <aside className="app-sidebar card">
        <NavLink className="brand" to="/dashboard">AI Interview</NavLink>
        <nav aria-label="Main navigation">
          {navigation.map(([label, to]) => (
            <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'active' : ''}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-account">
          <span>{user?.name || user?.email || 'Account'}</span>
          <button type="button" className="secondary-btn" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <div className="app-content">{children}</div>
    </div>
  );
}