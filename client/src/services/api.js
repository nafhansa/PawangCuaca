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
  const fp = localStorage.getItem('pwc_fp');
  if (fp) {
    config.headers['X-Voter-Hash'] = fp;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error?.message || 'Terjadi kesalahan';
    return Promise.reject({
      code: error.response?.data?.error?.code || 'NETWORK_ERROR',
      message,
    });
  }
);

export const weatherApi = {
  getWeather: (lat, lon) => api.get('/weather', { params: { lat, lon } }),
  getVotes: (lat, lon, hours = 12) => api.get('/weather/votes', { params: { lat, lon, hours } }),
};

export const votesApi = {
  submitVote: (data) => api.post('/votes', data),
  getRecentVotes: (limit = 20) => api.get('/votes/recent', { params: { limit } }),
};

export const locationsApi = {
  getLeaderboard: (limit = 10) => api.get('/locations/leaderboard', { params: { limit } }),
};

export default api;
