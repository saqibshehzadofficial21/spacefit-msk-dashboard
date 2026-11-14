import * as sensorService from '../services/sensorService.js';
import { sendSuccess } from '../utils/responseHandler.js';
import { audit, listResponse } from './crudHelpers.js';

export const list = async (req, res) => listResponse(res, await sensorService.listSensors(req.valid), 'Sensor records retrieved');
export const get = async (req, res) => sendSuccess(res, { data: await sensorService.getSensor(req.params.id), message: 'Sensor record retrieved' });
export const create = async (req, res) => {
  const record = await sensorService.createSensor(req.valid);
  await audit(req, 'create', 'sensor', record.id, `${record.metric} ${record.dataSource}`);
  return sendSuccess(res, { status: 201, data: record, message: 'Sensor measurement saved' });
};
export const update = async (req, res) => {
  const record = await sensorService.updateSensor(req.params.id, req.valid);
  await audit(req, 'update', 'sensor', record.id, record.metric);
  return sendSuccess(res, { data: record, message: 'Sensor measurement updated' });
};
export const remove = async (req, res) => {
  await sensorService.deleteSensor(req.params.id);
  await audit(req, 'delete', 'sensor', req.params.id, 'Sensor measurement deleted');
  return sendSuccess(res, { data: { id: req.params.id }, message: 'Sensor measurement deleted' });
};
export const importSamples = async (req, res) => {
  const result = await sensorService.importSamples(req.valid);
  await audit(req, 'import', 'sensor', req.valid.astronautId, `${result.imported} simulated rows imported, ${result.rejected} rejected`);
  return sendSuccess(res, { status: 201, data: result, message: `${result.imported} fictional sample row(s) imported as SIMULATED data` });
};
export const simulate = async (req, res) => {
  const result = await sensorService.simulateStream(req.valid);
  await audit(req, 'simulate', 'sensor', req.valid.astronautId, `${result.generated} simulated samples`);
  return sendSuccess(res, { status: 201, data: result, message: `${result.generated} SIMULATED sensor samples generated` });
};
