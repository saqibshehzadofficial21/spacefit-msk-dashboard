import api, { cleanParams } from './api.js';

/** Baseline and performance assessments share one shape; the endpoint selects the purpose. */
export const baselineService = {
  list: (params) => api.get('/baselines', { params: cleanParams(params) }),
  /** Full history for one astronaut, newest first (up to 200 records). */
  history: (astronautId) => api.get('/baselines', { params: { astronautId, pageSize: 200, sortBy: 'assessmentDate', order: 'desc' } }),
  get: (id) => api.get(`/baselines/${encodeURIComponent(id)}`),
  create: (payload) => api.post('/baselines', payload),
  update: (id, payload) => api.put(`/baselines/${encodeURIComponent(id)}`, payload),
};

export const performanceService = {
  list: (params) => api.get('/performance', { params: cleanParams(params) }),
  /** Full history for one astronaut, oldest first. Returns { data: [...] } (not paginated). */
  history: (astronautId, params) => api.get(`/performance/astronaut/${encodeURIComponent(astronautId)}`, { params: cleanParams(params) }),
  get: (id) => api.get(`/performance/${encodeURIComponent(id)}`),
  create: (payload) => api.post('/performance', payload),
  update: (id, payload) => api.put(`/performance/${encodeURIComponent(id)}`, payload),
};
