import api from './api.js';

export const missionService = {
  list: () => api.get('/missions'),
  create: (payload) => api.post('/missions', payload),
  update: (id, payload) => api.put(`/missions/${encodeURIComponent(id)}`, payload),
};
