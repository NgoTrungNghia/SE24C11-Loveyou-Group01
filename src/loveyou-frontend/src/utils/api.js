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
  signup: (data)                => api.post('/auth/signup', data),
  login:  (data)                => api.post('/auth/login',  data),
  logout: ()                    => api.post('/auth/logout'),
  forgotPassword: (email)       => api.post('/auth/password-reset/request', { email }),
  resetPassword: (token, newPassword) => api.post('/auth/password-reset/confirm', { token, newPassword }),
};

export const adminApi = {
  stats: () => api.get('/admin/stats'),
};

export default api;
