import { z } from 'zod';
import { safeText, optionalText, idField, isoDateField, missionPhase } from './common.js';

export const alertCreateSchema = z.object({
  astronautId: idField,
  category: z.enum(['performance-change', 'loading-change', 'exercise-adherence', 'functional-change', 'specialist-review']),
  severity: z.enum(['info', 'attention', 'critical']),
  relatedMetric: safeText(80).nullish().transform((v) => v ?? null),
  description: safeText(1000).pipe(z.string().min(5)),
});

export const alertUpdateSchema = z.object({
  reviewStatus: z.enum(['new', 'reviewed', 'acknowledged', 'resolved']).optional(),
  specialistNote: optionalText(2000),
});

export const insightReviewSchema = z.object({
  reviewStatus: z.enum(['unreviewed', 'reviewed', 'referred-to-specialist']),
});

export const analyseSchema = z.object({
  astronautId: idField.nullish().transform((v) => v ?? null),
});

export const reportSchema = z.object({
  reportType: z.enum([
    'exercise-history', 'exercise-adherence', 'muscle-performance', 'baseline-comparison',
    'sensor-measurements', 'adaptive-insights', 'alerts-summary', 'mission-phase-summary',
  ]),
  astronautId: idField.nullish().transform((v) => v ?? null),
  missionId: idField.nullish().transform((v) => v ?? null),
  missionPhase: z.enum(['all', 'preflight', 'in-flight', 'postflight']).default('all'),
  startDate: z.string().max(30).nullish().transform((v) => v ?? null),
  endDate: z.string().max(30).nullish().transform((v) => v ?? null),
  equipment: z.enum(['all', 'ARED', 'TREADMILL', 'CEVIS', 'ROCKY', 'NONE']).default('all'),
  category: z.enum(['all', 'resistance-training', 'treadmill', 'cycle-ergometer', 'functional']).default('all'),
  metric: z.string().max(60).default('all'),
  title: safeText(120).nullish().transform((v) => v || null),
});

export const settingsUpdateSchema = z.object({
  profile: z.object({ displayName: safeText(80), organisation: safeText(120) }).partial().optional(),
  preferences: z
    .object({
      defaultMissionPhase: z.enum(['all', 'preflight', 'in-flight', 'postflight']),
      defaultDateRangeDays: z.number().int().min(7).max(730),
      compactTables: z.boolean(),
    })
    .partial()
    .optional(),
  notifications: z
    .object({ minimumSeverity: z.enum(['info', 'attention', 'critical']), showToasts: z.boolean() })
    .partial()
    .optional(),
  thresholds: z
    .object({
      forceProduction: z.object({ percentChange: z.number().min(-100).max(0) }).optional(),
      movementVelocity: z.object({ percentChange: z.number().min(-100).max(0) }).optional(),
      jointROM: z.object({ percentChange: z.number().min(-100).max(0) }).optional(),
      repetitionPerformance: z.object({ percentChange: z.number().min(-100).max(0) }).optional(),
      movementConsistency: z.object({ pointsChange: z.number().min(-100).max(0) }).optional(),
      functionalScore: z.object({ percentChange: z.number().min(-100).max(0) }).optional(),
      loadingChange: z.object({ percentChange: z.number().min(0).max(200) }).optional(),
      adherence: z
        .object({ minimumPercent: z.number().min(0).max(100), windowDays: z.number().int().min(1).max(90), consecutiveMissedSessions: z.number().int().min(1).max(30) })
        .partial()
        .optional(),
      persistentAssessments: z.number().int().min(2).max(20).optional(),
    })
    .partial()
    .optional(),
});

export const userSchema = z.object({ role: z.enum(['administrator', 'medical-specialist', 'astronaut']) });
