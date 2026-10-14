import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="hero-shell">
      {/* Top Navigation */}
      <nav className="topbar">
        <Link className="brand-logo" to="/">
          <span className="brand-icon">AI</span>
          <div className="brand-identity">
            <span className="brand-text">Interview AI</span>
            <span className="brand-subtext">Simulator Pro</span>
          </div>
        </Link>
        <div className="nav-actions">
          <Link className="ghost-btn" to="/login">Sign in</Link>
          <Link className="primary-btn" to="/register">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div>
          <span className="eyebrow">
            <span className="badge badge-primary">AI-Powered Career Intelligence</span>
          </span>
          <h1>
            Master Your Next Tech Interview with <span className="gradient-text">Adaptive AI</span>
          </h1>
          <p>
            Simulate realistic technical, behavioral, voice, and live coding interviews customized
            to your resume and target engineering role. Get instant scoring, delivery feedback, and a personalized roadmap.
          </p>
          <div className="cta-row">
            <Link className="primary-btn" to="/register">
              Start Free Practice
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <Link className="secondary-btn" to="/login">Sign in to your account</Link>
          </div>
        </div>

        {/* Hero Interactive Preview Card */}
        <div className="hero-preview-card card">
          <div className="preview-score-badge">
            <div className="preview-circle">92%</div>
            <div>
              <strong style={{ display: 'block', fontSize: '1.05rem', color: '#fff' }}>Interview Readiness Score</strong>
              <small style={{ color: 'var(--accent)', fontWeight: 600 }}>Senior Full Stack Developer Track</small>
            </div>
          </div>

          <div className="preview-steps">
            <div className="preview-step-item">
              <span className="step-num">1</span>
              <div>
                <strong style={{ color: '#fff' }}>Upload Resume & Target Role</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Extracts your skills and matches them against role requirements.</p>
              </div>
            </div>
            <div className="preview-step-item">
              <span className="step-num">2</span>
              <div>
                <strong style={{ color: '#fff' }}>Adaptive AI Simulation</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Dynamic technical questions, speech pacing, and in-browser coding tests.</p>
              </div>
            </div>
            <div className="preview-step-item">
              <span className="step-num">3</span>
              <div>
                <strong style={{ color: '#fff' }}>Instant Diagnostic Feedback</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Granular score breakdown, skill gap detection, and daily study plan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="landing-features-grid">
        <div className="feature-box">
          <div className="feature-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
          </div>
          <h3>Realistic Mock Interviews</h3>
          <p>
            Choose from Technical, HR, Behavioral, or Mixed formats across Junior to Principal levels. Evaluates communication, technical depth, and problem-solving.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
          <h3>Voice & Speech Analysis</h3>
          <p>
            Practice speaking aloud with real-time speech-to-text. Measures words-per-minute, detects filler words, and delivers confidence estimates.
          </p>
        </div>

        <div className="feature-box">
          <div className="feature-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <h3>Coding Sandbox & Gaps</h3>
          <p>
            Solve targeted algorithmic coding challenges with automated test execution, error diagnostics, and a tailored learning roadmap.
          </p>
        </div>
      </section>
    </div>
  );
}
