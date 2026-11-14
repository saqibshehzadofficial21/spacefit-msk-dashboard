import api from './api.js';

export const settingsService = {
  get: () => api.get('/settings'),
  update: (payload) => api.put('/settings', payload),
  users: () => api.get('/settings/users'),
  audit: (limit = 50) => api.get('/settings/audit', { params: { limit } }),
  health: () => api.get('/health'),
};
