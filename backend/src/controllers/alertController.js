import * as alertService from '../services/alertService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { audit, listResponse } from './crudHelpers.js';

export const list = async (req, res) => listResponse(res, await alertService.listAlerts(req.valid), 'Alerts retrieved');
export const get = async (req, res) => sendSuccess(res, { data: await alertService.getAlert(req.params.id), message: 'Alert retrieved' });
export const create = async (req, res) => {
  const record = await alertService.createAlert(req.valid, req.user.role);
  await audit(req, 'create', 'alert', record.id, record.category);
  return sendSuccess(res, { status: 201, data: record, message: 'Alert created successfully' });
};
export const update = async (req, res) => {
  const record = await alertService.updateAlert(req.params.id, req.valid, req.user.role);
  await audit(req, 'update', 'alert', record.id, `status=${record.reviewStatus}`);
  return sendSuccess(res, { data: record, message: 'Alert updated successfully' });
};
export const remove = async (req, res) => {
  await alertService.deleteAlert(req.params.id);
  await audit(req, 'delete', 'alert', req.params.id, 'Alert deleted');
  return sendSuccess(res, { data: { id: req.params.id }, message: 'Alert deleted' });
};
