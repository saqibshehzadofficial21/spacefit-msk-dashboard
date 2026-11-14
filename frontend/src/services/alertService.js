import api, { cleanParams } from './api.js';

export const alertService = {
  list: (params) => api.get('/alerts', { params: cleanParams(params) }),
  get: (id) => api.get(`/alerts/${encodeURIComponent(id)}`),
  create: (payload) => api.post('/alerts', payload),
  update: (id, payload) => api.put(`/alerts/${encodeURIComponent(id)}`, payload),
  remove: (id) => api.delete(`/alerts/${encodeURIComponent(id)}`),
};
