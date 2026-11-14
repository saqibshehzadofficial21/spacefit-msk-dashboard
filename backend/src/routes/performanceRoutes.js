import { Router } from 'express';
import { createAssessmentController } from '../controllers/assessmentController.js';
import { createAssessmentService } from '../services/assessmentService.js';
import { validate } from '../middleware/validate.js';
import { requirePermission } from '../middleware/auth.js';
import { assessmentSchema, assessmentUpdateSchema } from '../validators/assessmentValidator.js';
import { listQuery } from '../validators/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const service = createAssessmentService({ collection: 'performanceAssessments', prefix: 'PRF', label: 'Performance assessment' });
const c = createAssessmentController(service, { entity: 'performance', label: 'Performance assessment' });
const router = Router();
router.get('/', requirePermission('performance:read'), validate(listQuery, 'query'), asyncHandler(c.list));
// History endpoint. Spec suggests /:astronautId; it is namespaced here so it cannot collide with /:id.
router.get('/astronaut/:astronautId', requirePermission('performance:read'), asyncHandler(c.history));
router.get('/:id', requirePermission('performance:read'), asyncHandler(c.get));
router.post('/', requirePermission('performance:write'), validate(assessmentSchema), asyncHandler(c.create));
router.put('/:id', requirePermission('performance:write'), validate(assessmentUpdateSchema), asyncHandler(c.update));
export default router;
