import { Router } from 'express';
import * as c from '../controllers/reportController.js';
import { validate } from '../middleware/validate.js';
import { requirePermission } from '../middleware/auth.js';
import { reportSchema } from '../validators/otherValidators.js';
import { listQuery } from '../validators/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';

const router = Router();
router.get('/', requirePermission('reports:read'), validate(listQuery.extend({ reportType: z.string().max(60).optional() }), 'query'), asyncHandler(c.list));
router.post('/generate', requirePermission('reports:generate'), validate(reportSchema), asyncHandler(c.generate));
router.get('/:id/export', requirePermission('reports:read'), asyncHandler(c.exportReport));
router.get('/:id', requirePermission('reports:read'), asyncHandler(c.get));
export default router;
