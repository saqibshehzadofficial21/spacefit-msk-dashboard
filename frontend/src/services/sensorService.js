import api, { cleanParams } from './api.js';

export const sensorService = {
  list: (params) => api.get('/sensors', { params: cleanParams(params) }),
  create: (payload) => api.post('/sensors', payload),
  update: (id, payload) => api.put(`/sensors/${encodeURIComponent(id)}`, payload),
  remove: (id) => api.delete(`/sensors/${encodeURIComponent(id)}`),
  importSamples: (payload) => api.post('/sensors/import', payload),
  simulate: (payload) => api.post('/sensors/simulate', payload),
};
