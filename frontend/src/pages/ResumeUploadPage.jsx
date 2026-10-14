import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume } from '../services/api';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function ResumeUploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const validateAndSetFile = (file) => {
    setError('');
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Only PDF resumes (.pdf) are supported.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 5MB.`);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select or drag in a PDF resume to continue.');
      return;
    }

    setUploading(true);
    setError('');
    try {
      const response = await uploadResume(selectedFile);
      navigate(`/resume-analysis?resumeId=${response.data.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Resume upload and extraction failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <span className="eyebrow">Resume Intelligence</span>
          <h2>Upload & Extract Resume</h2>
          <p style={{ margin: '6px 0 0' }}>Upload your latest PDF resume to automatically extract skills, experience, and personalize your mock interviews.</p>
        </div>
      </header>

      <div className="card upload-card" style={{ maxWidth: '780px' }}>
        <label
          className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={(e) => validateAndSetFile(e.target.files[0])}
            disabled={uploading}
          />

          <div className="upload-icon-circle">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          <div>
            <strong style={{ display: 'block', fontSize: '1.05rem', color: '#fff' }}>
              {selectedFile ? 'Change selected PDF resume' : 'Drag & drop your PDF resume here'}
            </strong>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              or click anywhere to browse files (Max 5MB, PDF only)
            </span>
          </div>

          {selectedFile && (
            <div className="file-selected-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              <span>{selectedFile.name} ({formatFileSize(selectedFile.size)})</span>
            </div>
          )}
        </label>

        {error && <div className="alert error" role="alert">{error}</div>}

        <div className="row-between" style={{ marginTop: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
            Text is parsed securely for interview question personalization.
          </span>
          <button
            className="primary-btn"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="recording-pulse-active">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                </svg>
                Extracting & Analyzing…
              </>
            ) : (
              'Upload & Analyze Resume'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
