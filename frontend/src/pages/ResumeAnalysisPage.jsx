import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getResume } from '../services/api';

export default function ResumeAnalysisPage() {
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resumeId');
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(Boolean(resumeId));
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (!resumeId) {
      setResume(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    getResume(resumeId)
      .then(({ data }) => {
        if (active) setResume(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError.response?.data?.message || 'Could not load this resume analysis.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [resumeId]);

  const analysis = resume?.analysis ?? {};
  const skills = Array.isArray(analysis.skills) ? analysis.skills : [];
  const projects = Array.isArray(analysis.projects) ? analysis.projects : [];

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Resume Intelligence</span>
          <h2>Candidate Profile Analysis</h2>
          <p style={{ margin: '6px 0 0' }}>Review extracted skills, experience history, and project achievements from your resume.</p>
        </div>
        <Link className="secondary-btn" to="/resume-upload">Upload New Version</Link>
      </header>

      {loading && <p>Extracting resume insights…</p>}
      {error && <p className="alert error" role="alert">{error}</p>}
      
      {!loading && !error && !resume && (
        <div className="card panel" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <h3>No Resume Analysis Selected</h3>
          <p style={{ maxWidth: '500px', margin: '8px auto 20px' }}>
            Upload a PDF resume to view AI-extracted skills, career background, and benchmark yourself for target roles.
          </p>
          <Link className="primary-btn" to="/resume-upload">Upload Resume Now</Link>
        </div>
      )}

      {resume && (
        <>
          <div className="card panel row-between" style={{ background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-gradient)', display: 'grid', placeItems: 'center', color: '#fff' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div>
                <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{resume.filename}</strong>
                <p style={{ margin: 0, fontSize: '0.85rem' }}>Parsed & saved to your interview profile</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link className="secondary-btn" to="/job-role">Compare With Target Role</Link>
              <Link className="primary-btn" to="/interview-config">Start Interview</Link>
            </div>
          </div>

          <div className="two-column">
            {/* Extracted Skills */}
            <div className="card panel">
              <div className="row-between">
                <h3>Extracted Skills</h3>
                <span className="badge badge-primary">{skills.length} skills identified</span>
              </div>
              <div className="tag-row" style={{ marginTop: '16px' }}>
                {skills.length ? skills.map((item) => (
                  <span key={item} className="tag">{item}</span>
                )) : <p>No technical skills were automatically identified in the text.</p>}
              </div>
            </div>

            {/* Education & Experience */}
            <div className="card panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <span className="eyebrow">Education Background</span>
                <p style={{ color: '#fff', fontWeight: 500 }}>{analysis.education || 'No specific degree or university detected.'}</p>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <span className="eyebrow">Professional Experience</span>
                <p style={{ color: '#fff', fontWeight: 500 }}>{analysis.experience || 'No previous positions or tenure detected.'}</p>
              </div>
            </div>
          </div>

          {/* Key Projects */}
          <div className="card panel">
            <h3>Featured Projects & Highlights</h3>
            <ul className="list-view">
              {projects.length ? projects.map((project) => (
                <li key={project}>
                  <div style={{ padding: '12px 16px', background: 'rgba(255, 255, 255, 0.025)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <p style={{ margin: 0, color: '#fff', fontSize: '0.94rem' }}>{project}</p>
                  </div>
                </li>
              )) : <li>No projects were identified in the resume text.</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
