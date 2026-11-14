import * as astronautService from '../services/astronautService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { audit, listResponse } from './crudHelpers.js';

export const list = async (req, res) => listResponse(res, await astronautService.listAstronauts(req.valid), 'Astronauts retrieved');

export const get = async (req, res) => sendSuccess(res, { data: await astronautService.getAstronaut(req.params.id), message: 'Astronaut retrieved' });

export const create = async (req, res) => {
  const record = await astronautService.createAstronaut(req.valid);
  await audit(req, 'create', 'astronaut', record.id, record.name);
  return sendSuccess(res, { status: 201, data: record, message: 'Astronaut created successfully' });
};

export const update = async (req, res) => {
  const record = await astronautService.updateAstronaut(req.params.id, req.valid);
  await audit(req, 'update', 'astronaut', record.id, record.name);
  return sendSuccess(res, { data: record, message: 'Astronaut updated successfully' });
};

export const remove = async (req, res) => {
  const result = await astronautService.deleteAstronaut(req.params.id);
  await audit(req, 'delete', 'astronaut', req.params.id, `Deleted with ${JSON.stringify(result.removedRecords)} related records`);
  return sendSuccess(res, { data: result, message: 'Astronaut and related records deleted' });
};
