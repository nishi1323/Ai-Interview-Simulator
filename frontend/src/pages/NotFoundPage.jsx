import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="auth-shell">
      <div className="auth-card card" style={{ textAlign: 'center' }}>
        <div className="brand-icon" style={{ margin: '0 auto 16px' }}>404</div>
        <h2>Page Not Found</h2>
        <p style={{ margin: '8px 0 20px' }}>The route you requested does not exist or has been moved.</p>
        <Link className="primary-btn" to="/dashboard">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
