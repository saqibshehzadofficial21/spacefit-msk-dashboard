import { Router } from 'express';
import * as c from '../controllers/dashboardController.js';
import { requirePermission } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/summary', requirePermission('astronauts:read'), asyncHandler(c.summary));
router.get('/exercise-trends', requirePermission('exercises:read'), asyncHandler(c.exerciseTrends));
router.get('/performance-trends', requirePermission('performance:read'), asyncHandler(c.performanceTrends));
router.get('/alerts', requirePermission('alerts:read'), asyncHandler(c.alerts));
export default router;
