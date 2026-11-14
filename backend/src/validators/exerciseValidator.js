import { z } from 'zod';
import { idField, isoDateField, missionPhase, optionalText } from './common.js';

export const EQUIPMENT = ['ARED', 'TREADMILL', 'CEVIS', 'ROCKY', 'NONE'];
export const CATEGORIES = ['resistance-training', 'treadmill', 'cycle-ergometer', 'functional'];

// Which equipment may record which exercise category. Functional tasks may be done with any equipment or none.
export const CATEGORY_EQUIPMENT = {
  'resistance-training': ['ARED', 'ROCKY'],
  treadmill: ['TREADMILL'],
  'cycle-ergometer': ['CEVIS'],
  functional: EQUIPMENT,
};

const num = (min, max) => z.number().min(min).max(max).nullish().transform((v) => v ?? null);

export const exerciseSchema = z
  .object({
    astronautId: idField,
    sessionDate: isoDateField,
    missionPhase,
    category: z.enum(CATEGORIES),
    equipment: z.enum(EQUIPMENT),
    prescribed: z.boolean().default(true),
    completionStatus: z.enum(['completed', 'partial', 'missed']),
    durationMinutes: num(0, 600),
    // Resistance training
    resistanceKg: num(0, 500),
    sets: z.number().int().min(0).max(50).nullish().transform((v) => v ?? null),
    repetitions: z.number().int().min(0).max(5000).nullish().transform((v) => v ?? null),
    // Treadmill
    speedKph: num(0, 30),
    harnessLoadN: num(0, 3000),
    // Cycle ergometer
    workloadW: num(0, 1000),
    distanceKm: num(0, 200),
    // Functional exercise
    movementPerformanceScore: num(0, 100),
    notes: optionalText(2000),
  })
  .superRefine((v, ctx) => {
    if (!CATEGORY_EQUIPMENT[v.category].includes(v.equipment)) {
      ctx.addIssue({ code: 'custom', path: ['equipment'], message: `Equipment ${v.equipment} does not match category ${v.category}` });
    }
    if (v.completionStatus === 'missed' && v.durationMinutes) {
      ctx.addIssue({ code: 'custom', path: ['durationMinutes'], message: 'A missed session cannot have a duration' });
    }
  });

export const exerciseUpdateSchema = z.object(Object.fromEntries(
  Object.entries(exerciseSchema.innerType().shape).map(([k, schema]) => [k, schema.optional()]),
));
