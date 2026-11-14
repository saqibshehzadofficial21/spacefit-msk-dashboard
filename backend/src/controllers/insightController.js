import * as insightService from '../services/insightService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { audit, listResponse } from './crudHelpers.js';

export const list = async (req, res) => listResponse(res, await insightService.listInsights(req.valid), 'Insights retrieved');
export const get = async (req, res) => sendSuccess(res, { data: await insightService.getInsight(req.params.id), message: 'Insight retrieved' });
export const analyse = async (req, res) => {
  const result = await insightService.runAnalysis(req.valid.astronautId);
  await audit(req, 'analyse', 'insight', req.valid.astronautId ?? 'all', `run ${result.runId}: ${result.insightsCreated} insights, ${result.alertsCreated} alerts`);
  return sendSuccess(res, { status: 201, data: result, message: 'Analysis complete' });
};
export const updateReview = async (req, res) => {
  const record = await insightService.updateInsightReview(req.params.id, req.valid.reviewStatus);
  await audit(req, 'review', 'insight', record.id, record.reviewStatus);
  return sendSuccess(res, { data: record, message: 'Insight review status updated' });
};
