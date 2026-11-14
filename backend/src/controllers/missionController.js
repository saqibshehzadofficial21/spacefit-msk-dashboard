import * as missionService from '../services/missionService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { audit } from './crudHelpers.js';

export const list = async (_req, res) => sendSuccess(res, { data: await missionService.listMissions(), message: 'Missions retrieved' });
export const get = async (req, res) => sendSuccess(res, { data: await missionService.getMission(req.params.id), message: 'Mission retrieved' });
export const create = async (req, res) => {
  const record = await missionService.createMission(req.valid);
  await audit(req, 'create', 'mission', record.id, record.name);
  return sendSuccess(res, { status: 201, data: record, message: 'Mission created successfully' });
};
export const update = async (req, res) => {
  const record = await missionService.updateMission(req.params.id, req.valid);
  await audit(req, 'update', 'mission', record.id, record.name);
  return sendSuccess(res, { data: record, message: 'Mission updated successfully' });
};
