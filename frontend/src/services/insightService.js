import api, { cleanParams } from './api.js';

export const insightService = {
  list: (params) => api.get('/insights', { params: cleanParams(params) }),
  analyse: (astronautId) => api.post('/insights/analyse', { astronautId: astronautId ?? null }),
  updateReview: (id, reviewStatus) => api.put(`/insights/${encodeURIComponent(id)}`, { reviewStatus }),
};
