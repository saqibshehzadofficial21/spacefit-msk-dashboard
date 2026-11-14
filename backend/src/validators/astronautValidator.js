import { z } from 'zod';
import { safeText, optionalText, idField, missionPhase } from './common.js';

export const astronautCreateSchema = z.object({
  name: safeText(120).pipe(z.string().min(2, 'Name must be at least 2 characters')),
  missionId: idField,
  missionPhase: missionPhase.default('preflight'),
  status: z.enum(['active', 'on-hold', 'completed']).default('active'),
  notes: optionalText(2000),
});

export const astronautUpdateSchema = astronautCreateSchema.partial();
