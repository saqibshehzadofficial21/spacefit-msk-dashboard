import { Router } from 'express';
import * as c from '../controllers/insightController.js';
import { validate } from '../middleware/validate.js';
import { requirePermission } from '../middleware/auth.js';
import { analyseSchema, insightReviewSchema } from '../validators/otherValidators.js';
import { listQuery } from '../validators/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';

const router = Router();
const insightList = listQuery.extend({
  severity: z.string().max(20).optional(),
  category: z.string().max(40).optional(),
  reviewStatus: z.string().max(40).optional(),
});
router.get('/', requirePermission('insights:read'), validate(insightList, 'query'), asyncHandler(c.list));
router.post('/analyse', requirePermission('insights:analyse'), validate(analyseSchema), asyncHandler(c.analyse));
router.get('/:id', requirePermission('insights:read'), asyncHandler(c.get));
router.put('/:id', requirePermission('insights:write'), validate(insightReviewSchema), asyncHandler(c.updateReview));
export default router;
