import api, { cleanParams } from './api.js';
import client from './api.js';

export const reportService = {
  list: (params) => api.get('/reports', { params: cleanParams(params) }),
  get: (id) => api.get(`/reports/${encodeURIComponent(id)}`),
  generate: (payload) => api.post('/reports/generate', payload),
  /** Download an export. Returns a Blob; the caller triggers the save. */
  exportBlob: (id, format) => client.get(`/reports/${encodeURIComponent(id)}/export`, { params: { format }, responseType: 'blob' }),
};
