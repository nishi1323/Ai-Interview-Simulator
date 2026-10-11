import './App.css';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage';
import JobRolePage from './pages/JobRolePage';
import InterviewConfigPage from './pages/InterviewConfigPage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import VoiceInterviewPage from './pages/VoiceInterviewPage';
import CodingInterviewPage from './pages/CodingInterviewPage';
import ResultPage from './pages/ResultPage';
import PerformanceReportPage from './pages/PerformanceReportPage';
import SkillGapPage from './pages/SkillGapPage';
import LearningRoadmapPage from './pages/LearningRoadmapPage';
import InterviewHistoryPage from './pages/InterviewHistoryPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import AppLayout from './components/AppLayout';
import AIAssistantPage from './pages/AIAssistantPage';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/assistant" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
        <Route path="/resume-upload" element={<ProtectedRoute><ResumeUploadPage /></ProtectedRoute>} />
        <Route path="/resume-analysis" element={<ProtectedRoute><ResumeAnalysisPage /></ProtectedRoute>} />
        <Route path="/job-role" element={<ProtectedRoute><JobRolePage /></ProtectedRoute>} />
        <Route path="/interview-config" element={<ProtectedRoute><InterviewConfigPage /></ProtectedRoute>} />
        <Route path="/interview-room" element={<ProtectedRoute><Navigate to="/interview-config" replace /></ProtectedRoute>} />
        <Route path="/interview-room/:interviewId" element={<ProtectedRoute><InterviewRoomPage /></ProtectedRoute>} />
        <Route path="/voice-interview" element={<ProtectedRoute><VoiceInterviewPage /></ProtectedRoute>} />
        <Route path="/coding-interview" element={<ProtectedRoute><CodingInterviewPage /></ProtectedRoute>} />
        <Route path="/result" element={<ProtectedRoute><Navigate to="/history" replace /></ProtectedRoute>} />
        <Route path="/result/:interviewId" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="/report" element={<ProtectedRoute><PerformanceReportPage /></ProtectedRoute>} />
        <Route path="/skill-gaps" element={<ProtectedRoute><SkillGapPage /></ProtectedRoute>} />
        <Route path="/roadmap" element={<ProtectedRoute><LearningRoadmapPage /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><InterviewHistoryPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
