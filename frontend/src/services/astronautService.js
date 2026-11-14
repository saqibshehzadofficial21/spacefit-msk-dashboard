import api, { cleanParams } from './api.js';

export const astronautService = {
  list: (params) => api.get('/astronauts', { params: cleanParams(params) }),
  get: (id) => api.get(`/astronauts/${encodeURIComponent(id)}`),
  create: (payload) => api.post('/astronauts', payload),
  update: (id, payload) => api.put(`/astronauts/${encodeURIComponent(id)}`, payload),
  remove: (id) => api.delete(`/astronauts/${encodeURIComponent(id)}`),
};
