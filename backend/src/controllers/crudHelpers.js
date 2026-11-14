import { sendSuccess } from '../utils/responseHandler.js';
import { recordAudit } from '../services/auditService.js';

/** Audit helper: every successful mutation is recorded with the demo role that performed it. */
export const audit = (req, action, entity, entityId, summary) =>
  recordAudit({ role: req.user?.role ?? 'unknown', action, entity, entityId, summary });

export function listResponse(res, result, message) {
  return sendSuccess(res, { data: result.data, meta: result.meta, message });
}
