import * as exerciseService from '../services/exerciseService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { audit, listResponse } from './crudHelpers.js';

export const list = async (req, res) => listResponse(res, await exerciseService.listExercises(req.valid), 'Exercise records retrieved');
export const get = async (req, res) => sendSuccess(res, { data: await exerciseService.getExercise(req.params.id), message: 'Exercise record retrieved' });
export const create = async (req, res) => {
  const record = await exerciseService.createExercise(req.valid);
  await audit(req, 'create', 'exercise', record.id, `${record.category}/${record.equipment} ${record.sessionDate}`);
  return sendSuccess(res, { status: 201, data: record, message: 'Exercise record created successfully' });
};
export const update = async (req, res) => {
  const record = await exerciseService.updateExercise(req.params.id, req.valid);
  await audit(req, 'update', 'exercise', record.id, record.equipment);
  return sendSuccess(res, { data: record, message: 'Exercise record updated successfully' });
};
export const remove = async (req, res) => {
  await exerciseService.deleteExercise(req.params.id);
  await audit(req, 'delete', 'exercise', req.params.id, 'Exercise record deleted');
  return sendSuccess(res, { data: { id: req.params.id }, message: 'Exercise record deleted' });
};
