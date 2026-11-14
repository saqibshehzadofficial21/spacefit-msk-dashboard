import { z } from 'zod';
import { safeText, optionalIsoDate, idField } from './common.js';

export const missionSchema = z.object({
  id: idField.optional(),
  code: safeText(40).pipe(z.string().min(2)),
  name: safeText(160).pipe(z.string().min(3)),
  startDate: z.string().min(8).refine((v) => !Number.isNaN(Date.parse(v)), 'Invalid start date').transform((v) => new Date(v).toISOString()),
  endDate: optionalIsoDate,
  status: z.enum(['planned', 'active', 'completed']).default('planned'),
});

export const missionUpdateSchema = missionSchema.partial();
