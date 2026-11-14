import { Router } from 'express';
import * as c from '../controllers/missionController.js';
import { validate } from '../middleware/validate.js';
import { requirePermission } from '../middleware/auth.js';
import { missionSchema, missionUpdateSchema } from '../validators/missionValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/', requirePermission('missions:read'), asyncHandler(c.list));
router.get('/:id', requirePermission('missions:read'), asyncHandler(c.get));
router.post('/', requirePermission('missions:write'), validate(missionSchema), asyncHandler(c.create));
router.put('/:id', requirePermission('missions:write'), validate(missionUpdateSchema), asyncHandler(c.update));
export default router;
