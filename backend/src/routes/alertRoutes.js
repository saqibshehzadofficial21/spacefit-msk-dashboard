import { Router } from 'express';
import * as c from '../controllers/alertController.js';
import { validate } from '../middleware/validate.js';
import { requirePermission } from '../middleware/auth.js';
import { alertCreateSchema, alertUpdateSchema } from '../validators/otherValidators.js';
import { listQuery } from '../validators/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';

const router = Router();
const alertList = listQuery.extend({
  severity: z.string().max(20).optional(),
  category: z.string().max(40).optional(),
  reviewStatus: z.string().max(40).optional(),
});
router.get('/', requirePermission('alerts:read'), validate(alertList, 'query'), asyncHandler(c.list));
router.get('/:id', requirePermission('alerts:read'), asyncHandler(c.get));
router.post('/', requirePermission('alerts:write'), validate(alertCreateSchema), asyncHandler(c.create));
router.put('/:id', requirePermission('alerts:write'), validate(alertUpdateSchema), asyncHandler(c.update));
router.delete('/:id', requirePermission('alerts:delete'), asyncHandler(c.remove));
export default router;
