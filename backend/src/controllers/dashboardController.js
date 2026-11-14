import * as dashboardService from '../services/dashboardService.js';
import { sendSuccess } from '../utils/responseHandler.js';

/** Dashboard queries accept the same global filters as the top bar. Values are sanitised by the services. */
const filtersFrom = (req) => ({ ...req.query });

export const summary = async (req, res) => sendSuccess(res, { data: await dashboardService.getSummary(filtersFrom(req)), message: 'Dashboard summary calculated from stored records' });
export const exerciseTrends = async (req, res) => sendSuccess(res, { data: await dashboardService.getExerciseTrends(filtersFrom(req)), message: 'Exercise trends calculated' });
export const performanceTrends = async (req, res) => sendSuccess(res, { data: await dashboardService.getPerformanceTrends(filtersFrom(req)), message: 'Performance trends calculated' });
export const alerts = async (req, res) => sendSuccess(res, { data: await dashboardService.getAlertFeed({ ...filtersFrom(req), limit: Math.min(Number(req.query.limit) || 10, 50) }), message: 'Recent alerts retrieved' });
