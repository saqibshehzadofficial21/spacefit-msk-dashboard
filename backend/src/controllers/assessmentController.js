import { sendSuccess } from '../utils/responseHandler.js';
import { audit, listResponse } from './crudHelpers.js';

/** Same handlers for baselines and performance assessments; `entity` labels the audit trail. */
export function createAssessmentController(service, { entity, label }) {
  return {
    list: async (req, res) => listResponse(res, await service.list(req.valid), `${label} records retrieved`),
    get: async (req, res) => sendSuccess(res, { data: await service.get(req.params.id), message: `${label} record retrieved` }),
    history: async (req, res) => sendSuccess(res, { data: await service.history(req.params.astronautId, req.valid), message: `${label} history retrieved` }),
    create: async (req, res) => {
      const record = await service.create(req.valid);
      await audit(req, 'create', entity, record.id, `${record.astronautId} ${record.assessmentDate}`);
      return sendSuccess(res, { status: 201, data: record, message: `${label} record created successfully` });
    },
    update: async (req, res) => {
      const record = await service.update(req.params.id, req.valid);
      await audit(req, 'update', entity, record.id, record.astronautId);
      return sendSuccess(res, { data: record, message: `${label} record updated successfully` });
    },
  };
}
