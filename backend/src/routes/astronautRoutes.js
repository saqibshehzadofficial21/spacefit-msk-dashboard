import { Router } from 'express';
import * as c from '../controllers/astronautController.js';
import { validate } from '../middleware/validate.js';
import { requirePermission } from '../middleware/auth.js';
import { listQuery } from '../validators/common.js';
import { astronautCreateSchema, astronautUpdateSchema } from '../validators/astronautValidator.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
const listSchema = listQuery.extend({ missionId: listQuery.shape.astronautId.optional(), status: listQuery.shape.q.optional() });
router.get('/', requirePermission('astronauts:read'), validate(listSchema, 'query'), asyncHandler(c.list));
router.get('/:id', requirePermission('astronauts:read'), asyncHandler(c.get));
router.post('/', requirePermission('astronauts:write'), validate(astronautCreateSchema), asyncHandler(c.create));
router.put('/:id', requirePermission('astronauts:write'), validate(astronautUpdateSchema), asyncHandler(c.update));
router.delete('/:id', requirePermission('astronauts:delete'), asyncHandler(c.remove));
export default router;
