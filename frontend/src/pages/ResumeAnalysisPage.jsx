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
      <div className="page-header">
        <div>
          <span className="eyebrow">Resume intelligence</span>
          <h2>Candidate profile summary</h2>
        </div>
      </div>

      {loading && <p>Loading saved resume analysis…</p>}
      {error && <p className="alert error" role="alert">{error}</p>}
      {!loading && !error && !resume && (
        <div className="card panel">
          <p>Upload a resume to save and view its analysis.</p>
          <Link className="primary-btn" to="/resume-upload">Upload resume</Link>
        </div>
      )}
      {resume && (
        <>
          <p className="eyebrow">{resume.filename}</p>
          <div className="two-column">
            <div className="card panel">
              <h3>Skills</h3>
              <div className="tag-row">
                {skills.length ? skills.map((item) => (
                  <span key={item} className="tag">{item}</span>
                )) : <p>No skills were identified in the resume text.</p>}
              </div>
            </div>

            <div className="card panel">
              <h3>Education</h3>
              <p>{analysis.education || 'No education details identified.'}</p>
              <h3>Experience</h3>
              <p>{analysis.experience || 'No experience details identified.'}</p>
            </div>
          </div>

          <div className="card panel">
            <h3>Projects</h3>
            <ul className="list-view">
              {projects.length ? projects.map((project) => <li key={project}>{project}</li>) : <li>No projects were identified in the resume.</li>}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
