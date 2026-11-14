import { Router } from 'express';
import { createAssessmentController } from '../controllers/assessmentController.js';
import { createAssessmentService } from '../services/assessmentService.js';
import { validate } from '../middleware/validate.js';
import { requirePermission } from '../middleware/auth.js';
import { assessmentSchema, assessmentUpdateSchema } from '../validators/assessmentValidator.js';
import { listQuery } from '../validators/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const service = createAssessmentService({ collection: 'baselineAssessments', prefix: 'BAS', label: 'Baseline assessment' });
const c = createAssessmentController(service, { entity: 'baseline', label: 'Baseline assessment' });
const router = Router();
router.get('/', requirePermission('baselines:read'), validate(listQuery, 'query'), asyncHandler(c.list));
router.get('/:id', requirePermission('baselines:read'), asyncHandler(c.get));
router.post('/', requirePermission('baselines:write'), validate(assessmentSchema), asyncHandler(c.create));
router.put('/:id', requirePermission('baselines:write'), validate(assessmentUpdateSchema), asyncHandler(c.update));
export default router;
