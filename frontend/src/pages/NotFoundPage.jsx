import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card card">
        <h2>Page not found</h2>
        <p>The route you requested does not exist.</p>
        <Link className="primary-btn" to="/dashboard">Back to dashboard</Link>
      </div>
    </div>
  );
}
