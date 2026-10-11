import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="page-shell hero-shell">
      <nav className="topbar">
        <div className="brand">AI Interview Simulator</div>
        <div className="nav-actions">
          <Link to="/login">Login</Link>
          <Link className="primary-btn" to="/register">Get Started</Link>
        </div>
      </nav>

      <section className="hero-section">
        <div>
          <span className="eyebrow">AI-powered hiring readiness</span>
          <h1>Practice realistic interviews built around your resume and target role.</h1>
          <p>
            Simulate technical, HR, behavioral, and coding interviews with adaptive questions,
            personalized feedback, skill-gap tracking, and a dynamic learning roadmap.
          </p>
          <div className="cta-row">
            <Link className="primary-btn" to="/register">Create Account</Link>
            <Link className="secondary-btn" to="/login">Sign in</Link>
          </div>
        </div>
        <div className="hero-panel card">
          <span className="eyebrow">Practice loop</span>
          <h3>Resume → role → interview</h3>
          <ul>
            <li>Extract skills from a text-based PDF</li>
            <li>Compare your skills with a job description</li>
            <li>Save scored answers and review progress</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
