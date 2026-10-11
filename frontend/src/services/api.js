import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aiInterviewToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use((response) => response, (error) => {
  const isPublicAuthRequest = ['/auth/login', '/auth/register'].some((path) => error.config?.url?.startsWith(path));
  if (error.response?.status === 401 && !isPublicAuthRequest) {
    localStorage.removeItem('aiInterviewToken');
    localStorage.removeItem('aiInterviewUser');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.assign('/login?reason=session-expired');
    }
  }
  return Promise.reject(error);
});

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getCurrentUser = () => api.get('/auth/me');
export const updateCurrentUser = (data) => api.put('/auth/me', data);
export const evaluateAnswer = (answer) => api.post('/ai/evaluate-answer', { answer });
export const chatWithAssistant = (message, history = []) => api.post('/assistant/chat', { message, history });
export const analyzeSpeech = (transcript, durationSeconds) => api.post('/ai/analyze-speech', { transcript, durationSeconds });
export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getResume = (id) => api.get(`/resume/${id}`);
export const createInterview = (payload) => api.post('/interviews', payload);
export const getInterviews = () => api.get('/interviews');
export const getInterviewDetails = (id) => api.get(`/interviews/${id}`);
export const submitAnswer = (id, payload) => api.post(`/interviews/${id}/answer`, payload);
export const getReport = (id) => api.get(`/reports/${id}`);
export const getSkillGaps = () => api.get('/skill-gaps');
export const getRoadmap = () => api.get('/roadmap');
export const getCodingChallenges = () => api.get('/coding-practice/challenges');
export const matchJobRole = (payload) => api.post('/job-roles/match', payload);
export default api;
