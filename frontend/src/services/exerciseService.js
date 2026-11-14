import api, { cleanParams } from './api.js';

export const exerciseService = {
  list: (params) => api.get('/exercises', { params: cleanParams(params) }),
  create: (payload) => api.post('/exercises', payload),
  update: (id, payload) => api.put(`/exercises/${encodeURIComponent(id)}`, payload),
  remove: (id) => api.delete(`/exercises/${encodeURIComponent(id)}`),
  trends: (params) => api.get('/dashboard/exercise-trends', { params: cleanParams(params) }),
};
