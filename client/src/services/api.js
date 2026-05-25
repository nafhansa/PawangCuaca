import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pwc_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  const fp = localStorage.getItem('pwc_fp');
  if (fp) {
    config.headers['X-Voter-Hash'] = fp;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pwc_token');
      const publicPaths = ['/', '/tentang', '/login', '/register'];
      const isPublicPage = publicPaths.some((path) => window.location.pathname === path);
      if (!isPublicPage && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.error?.message || 'Terjadi kesalahan';
    return Promise.reject({
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      message,
    });
  }
);

export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
};

export const adminApi = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getStats: () => api.get('/admin/stats'),
  getDetailedStats: () => api.get('/admin/stats/detailed'),
  approveUser: (id) => api.put(`/admin/users/${id}/approve`),
  rejectUser: (id) => api.put(`/admin/users/${id}/reject`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const reportsApi = {
  create: (formData) => api.post('/reports', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  getAll: (params) => api.get('/reports', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  update: (id, data) => api.put(`/reports/${id}`, data),
  delete: (id) => api.delete(`/reports/${id}`),
  vote: (id, voteType) => api.post(`/reports/${id}/vote`, { vote_type: voteType }),
};

export const threadsApi = {
  create: (data) => api.post('/threads', data),
  getAll: (params) => api.get('/threads', { params }),
  getById: (id) => api.get(`/threads/${id}`),
  addPost: (id, formData) => api.post(`/threads/${id}/posts`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  }),
  delete: (id) => api.delete(`/threads/${id}`),
};

export const weatherApi = {
  getWeather: (lat, lon) => api.get('/weather', { params: { lat, lon } }),
  getVotes: (lat, lon, hours = 12) => api.get('/weather/votes', { params: { lat, lon, hours } }),
};

export const votesApi = {
  submitVote: (data) => api.post('/votes', data),
  getRecentVotes: (limit = 20) => api.get('/votes/recent', { params: { limit } }),
  getMyVotes: (limit = 50) => api.get('/votes/my', { params: { limit } }),
};

export const activityApi = {
  getMyActivity: (limit = 50) => api.get('/activity/my', { params: { limit } }),
};

export const locationsApi = {
  getLeaderboard: (limit = 10) => api.get('/locations/leaderboard', { params: { limit } }),
};

export default api;
