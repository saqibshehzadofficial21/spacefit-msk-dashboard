import { Router } from 'express';
import * as c from '../controllers/sensorController.js';
import { validate } from '../middleware/validate.js';
import { requirePermission } from '../middleware/auth.js';
import { sensorSchema, sensorUpdateSchema, sampleImportSchema, simulateSchema } from '../validators/sensorValidator.js';
import { listQuery } from '../validators/common.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';

const router = Router();
const sensorList = listQuery.extend({
  sensorType: z.string().max(20).optional(),
  metric: z.string().max(60).optional(),
  exerciseSessionId: z.string().max(80).optional(),
  dataSource: z.string().max(30).optional(),
});
router.get('/', requirePermission('sensors:read'), validate(sensorList, 'query'), asyncHandler(c.list));
router.post('/import', requirePermission('sensors:write'), validate(sampleImportSchema), asyncHandler(c.importSamples));
router.post('/simulate', requirePermission('sensors:write'), validate(simulateSchema), asyncHandler(c.simulate));
router.get('/:id', requirePermission('sensors:read'), asyncHandler(c.get));
router.post('/', requirePermission('sensors:write'), validate(sensorSchema), asyncHandler(c.create));
router.put('/:id', requirePermission('sensors:write'), validate(sensorUpdateSchema), asyncHandler(c.update));
router.delete('/:id', requirePermission('sensors:write'), asyncHandler(c.remove));
export default router;
