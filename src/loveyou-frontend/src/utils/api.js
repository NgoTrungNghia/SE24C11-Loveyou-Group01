import axios from 'axios';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  }
  return 'http://localhost:3000/api';
};

const BASE = getApiBaseUrl();

const api = axios.create({ baseURL: BASE });

// Attach JWT automatically
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('ly_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Auto-handle BANNED and UNAUTHORIZED accounts across all API responses
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const errCode = err.response?.data?.error?.code;
    const errMsg = err.response?.data?.error?.message;
    if (errCode === 'ACCOUNT_BANNED' || (err.response?.status === 403 && errMsg?.includes('khóa'))) {
      localStorage.removeItem('ly_token');
      window.location.href = '/login?banned=true';
    } else if (err.response?.status === 401) {
      const url = String(err.config?.url || '');
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAuthUrl = url.includes('/auth/') || url.includes('/login') || url.includes('/signup');
      const isPublicPage = ['/login', '/signup', '/forgot-password', '/reset-password'].some(p => pathname.startsWith(p));

      if (!isAuthUrl && !isPublicPage) {
        localStorage.removeItem('ly_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth endpoints ──
export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (resetToken, newPassword) =>
    api.post('/auth/reset-password', { resetToken, newPassword }),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  blockUser: (targetId) => api.post('/users/block', { targetId }),
  getBlockedUsers: () => api.get('/users/blocked'),
  unblockUser: (targetId) => api.post('/users/unblock', { targetId }),
  reportUser: (targetId, reason) => api.post('/users/report', { targetId, reason }),
  sendEmailVerification: () => api.post('/users/send-email-verification'),
  verifyEmail: (code) => api.post('/users/verify-email', { code }),
  verifyCitizen: (data) => api.post('/users/verify-citizen', data),
};

export const matchingApi = {
  getCandidates: () => api.get('/matching/candidates'),
  swipe: (targetId, action) => api.post('/matching/swipe', { targetId, action }),
  getMatches: () => api.get('/matching/matches'),
  unmatch: (targetId) => api.post('/matching/unmatch', { targetId }),
  getWhoLikedMe: () => api.get('/matching/who-liked-me'),
  getWhoILiked: () => api.get('/matching/who-i-liked'),
};

export const paymentApi = {
  createPaymentLink: (returnUrl, cancelUrl) => api.post('/payment/create-payment-link', { returnUrl, cancelUrl }),
  getStatus: (orderCode) => api.get(`/payment/status/${orderCode}`),
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
  clearConversation: (conversationId) => api.post(`/chat/${conversationId}/clear`),
  detectRedFlags: (conversationId) => api.post(`/chat/${conversationId}/detect-red-flags`),
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
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  toggleBan: (id) => api.put(`/admin/users/${id}/ban`),
  getReports: () => api.get('/admin/reports'),
  updateReportStatus: (id, status, resolution) => api.put(`/admin/reports/${id}/status`, { status, resolution }),
  getApiKey: () => api.get('/admin/config/api-key'),
  setApiKey: (key) => api.put('/admin/config/api-key', { key }),
};

export const supportApi = {
  getMyConversation: () => api.get('/support/my-conversation'),
  sendUserMessage: (content) => api.post('/support/send', { content }),
  getAdminConversations: (search = '') => api.get(`/support/admin/conversations?search=${encodeURIComponent(search)}`),
  getAdminConversationMessages: (conversationId) => api.get(`/support/admin/conversations/${conversationId}/messages`),
  getAdminConversationByUserId: (userId) => api.get(`/support/admin/conversations/user/${userId}`),
  sendAdminMessage: (conversationId, content) => api.post(`/support/admin/conversations/${conversationId}/send`, { content }),
  markAdminRead: (conversationId) => api.patch(`/support/admin/conversations/${conversationId}/read`),
};

export default api;
