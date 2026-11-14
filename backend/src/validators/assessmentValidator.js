import { z } from 'zod';
import { idField, isoDateField, missionPhase, optionalText } from './common.js';

const metric = (min, max) => z.number().min(min).max(max).nullish().transform((v) => v ?? null);

/**
 * Shared shape for baseline assessments and performance assessments (same metrics, different purpose).
 * Units follow the metric catalogue. Unmeasured metrics are stored as null, never as zero.
 */
export const assessmentSchema = z
  .object({
    astronautId: idField,
    assessmentDate: isoDateField,
    missionPhase,
    exerciseSessionId: idField.nullish().transform((v) => v ?? null),
    forceProduction: metric(0, 10000),        // N, instrumented force sensor
    movementVelocity: metric(0, 10),          // m/s, IMU-derived
    jointROM: metric(0, 360),                 // degrees, IMU-derived joint estimate
    repetitionPerformance: metric(0, 1000),   // repetitions meeting the recorded target
    movementConsistency: metric(0, 100),      // %, repeated movement comparison
    functionalScore: metric(0, 1000),         // points defined by the local assessment protocol
    functionalResult: z.enum(['completed', 'partially-completed', 'not-completed', 'not-assessed']).default('not-assessed'),
    notes: optionalText(2000),
  })
  .refine(
    (v) => ['forceProduction', 'movementVelocity', 'jointROM', 'repetitionPerformance', 'movementConsistency', 'functionalScore'].some((k) => v[k] !== null) || v.functionalResult !== 'not-assessed',
    { message: 'Enter at least one measurement or a functional result' },
  );

export const assessmentUpdateSchema = z.object({
  assessmentDate: isoDateField.optional(),
  missionPhase: missionPhase.optional(),
  exerciseSessionId: idField.nullish(),
  forceProduction: metric(0, 10000).optional(),
  movementVelocity: metric(0, 10).optional(),
  jointROM: metric(0, 360).optional(),
  repetitionPerformance: metric(0, 1000).optional(),
  movementConsistency: metric(0, 100).optional(),
  functionalScore: metric(0, 1000).optional(),
  functionalResult: z.enum(['completed', 'partially-completed', 'not-completed', 'not-assessed']).optional(),
  notes: optionalText(2000),
});
