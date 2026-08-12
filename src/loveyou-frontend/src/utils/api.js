import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({ baseURL: BASE });

// Attach JWT automatically
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('ly_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ── Auth endpoints ──
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (resetToken, newPassword) =>
    api.post('/auth/reset-password', { resetToken, newPassword }),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
};

export const matchingApi = {
  getCandidates: () => api.get('/matching/candidates'),
  swipe: (targetId, action) => api.post('/matching/swipe', { targetId, action }),
  getMatches: () => api.get('/matching/matches'),
  unmatch: (targetId) => api.post('/matching/unmatch', { targetId }),
};

export const aiMatchingApi = {
  getAICandidates: () => api.get('/ai/ai-candidates'),
  getPreferences: () => api.get('/ai/preferences'),
  updatePreferences: (data) => api.put('/ai/preferences', data),
};

export const chatApi = {
  getConversations: () => api.get('/chat/conversations'),
  initConversation: (matchId) => api.get(`/chat/conversations/${matchId}/init`),
  getMessages: (conversationId, page = 1) => api.get(`/chat/${conversationId}/messages?page=${page}`),
  sendMessage: (conversationId, content, type = 'TEXT') => api.post(`/chat/${conversationId}/messages`, { content, type }),
  markRead: (conversationId) => api.put(`/chat/${conversationId}/read`),
};

export const gameApi = {
  createGame: (gameType, partnerId, matchId) => api.post('/games/create', { gameType, partnerId, matchId }),
  getGame: (sessionId) => api.get(`/games/${sessionId}`),
  submitAnswer: (sessionId, questionIndex, answer) => api.post(`/games/${sessionId}/answer`, { questionIndex, answer }),
  getResult: (sessionId) => api.get(`/games/${sessionId}/result`),
};

export const uploadApi = {
  uploadAvatar: (imageData) => api.post('/upload/avatar', { imageData }),
  uploadPhotos: (photos) => api.post('/upload/photos', { photos }),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
};

export default api;
