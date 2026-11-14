import { Router } from 'express';
import * as c from '../controllers/settingsController.js';
import { validate } from '../middleware/validate.js';
import { requirePermission } from '../middleware/auth.js';
import { settingsUpdateSchema } from '../validators/otherValidators.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/', requirePermission('settings:read'), asyncHandler(c.get));
router.put('/', requirePermission('settings:write'), validate(settingsUpdateSchema), asyncHandler(c.update));
router.get('/users', requirePermission('settings:read'), asyncHandler(c.users));
router.get('/audit', requirePermission('audit:read'), asyncHandler(c.auditTrail));
export default router;
