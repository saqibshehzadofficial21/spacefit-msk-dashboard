import api, { cleanParams } from './api.js';

export const dashboardService = {
  summary: (params) => api.get('/dashboard/summary', { params: cleanParams(params) }),
  exerciseTrends: (params) => api.get('/dashboard/exercise-trends', { params: cleanParams(params) }),
  performanceTrends: (params) => api.get('/dashboard/performance-trends', { params: cleanParams(params) }),
  alerts: (params) => api.get('/dashboard/alerts', { params: cleanParams(params) }),
};
