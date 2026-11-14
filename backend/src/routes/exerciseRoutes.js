import { Router } from 'express';
import * as c from '../controllers/exerciseController.js';
import { validate } from '../middleware/validate.js';
import { requirePermission } from '../middleware/auth.js';
import { exerciseSchema, exerciseUpdateSchema } from '../validators/exerciseValidator.js';
import { listQuery } from '../validators/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';

const router = Router();
const exerciseList = listQuery.extend({
  category: z.string().max(40).optional(),
  equipment: z.string().max(20).optional(),
  completionStatus: z.string().max(20).optional(),
  prescribed: z.enum(['true', 'false']).optional(),
});
router.get('/', requirePermission('exercises:read'), validate(exerciseList, 'query'), asyncHandler(c.list));
router.get('/:id', requirePermission('exercises:read'), asyncHandler(c.get));
router.post('/', requirePermission('exercises:write'), validate(exerciseSchema), asyncHandler(c.create));
router.put('/:id', requirePermission('exercises:write'), validate(exerciseUpdateSchema), asyncHandler(c.update));
router.delete('/:id', requirePermission('exercises:write'), asyncHandler(c.remove));
export default router;
