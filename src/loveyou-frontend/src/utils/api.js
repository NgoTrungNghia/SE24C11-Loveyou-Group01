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
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
};

export default api;
