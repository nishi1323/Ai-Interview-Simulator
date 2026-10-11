import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume } from '../services/api';

export default function ResumeUploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage('Please select a PDF resume to continue.');
      return;
    }

    try {
      const response = await uploadResume(selectedFile);
      navigate(`/resume-analysis?resumeId=${response.data.id}`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Resume upload failed.');
    }
  };

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <span className="eyebrow">Resume module</span>
          <h2>Upload and analyze your resume</h2>
        </div>
      </div>

      <div className="card upload-card">
        <label className="upload-dropzone">
          <input type="file" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files[0])} />
          <span>{selectedFile ? selectedFile.name : 'Choose a PDF resume'}</span>
        </label>
        <button className="primary-btn" onClick={handleUpload}>Upload resume</button>
        {message && <div className="alert error" role="alert">{message}</div>}
      </div>
    </div>
  );
}
