import { z } from 'zod';

const optNum = (min, max) => z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
  z.number({ invalid_type_error: 'Enter a number' }).min(min, `Must be at least ${min}`).max(max, `Must be at most ${max}`).nullable(),
);
const optText = (max = 2000) => z.string().max(max, `Maximum ${max} characters`).optional().nullable();

export const astronautFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  missionId: z.string().min(1, 'Select a mission'),
  missionPhase: z.enum(['preflight', 'in-flight', 'postflight']),
  status: z.enum(['active', 'on-hold', 'completed']),
  notes: optText(),
});

export const missionFormSchema = z.object({
  code: z.string().trim().min(2, 'Enter a short code').max(40),
  name: z.string().trim().min(3, 'Enter a name (mark demonstration missions as fictional)').max(160),
  startDate: z.string().min(8, 'Enter a start date'),
  endDate: z.string().optional().nullable(),
  status: z.enum(['planned', 'active', 'completed']),
});

export const assessmentFormSchema = z
  .object({
    astronautId: z.string().min(1, 'Select an astronaut'),
    assessmentDate: z.string().min(8, 'Enter a date'),
    missionPhase: z.enum(['preflight', 'in-flight', 'postflight']),
    forceProduction: optNum(0, 10000),
    movementVelocity: optNum(0, 10),
    jointROM: optNum(0, 360),
    repetitionPerformance: optNum(0, 1000),
    movementConsistency: optNum(0, 100),
    functionalScore: optNum(0, 1000),
    functionalResult: z.enum(['completed', 'partially-completed', 'not-completed', 'not-assessed']),
    notes: optText(),
  })
  .refine((v) => ['forceProduction', 'movementVelocity', 'jointROM', 'repetitionPerformance', 'movementConsistency', 'functionalScore'].some((k) => v[k] !== null) || v.functionalResult !== 'not-assessed', {
    message: 'Enter at least one measurement or a functional result',
    path: ['forceProduction'],
  });

export const exerciseFormSchema = z
  .object({
    astronautId: z.string().min(1, 'Select an astronaut'),
    sessionDate: z.string().min(8, 'Enter a date'),
    missionPhase: z.enum(['preflight', 'in-flight', 'postflight']),
    category: z.enum(['resistance-training', 'treadmill', 'cycle-ergometer', 'functional']),
    equipment: z.enum(['ARED', 'TREADMILL', 'CEVIS', 'ROCKY', 'NONE']),
    prescribed: z.boolean(),
    completionStatus: z.enum(['completed', 'partial', 'missed']),
    durationMinutes: optNum(0, 600),
    resistanceKg: optNum(0, 500),
    sets: optNum(0, 50),
    repetitions: optNum(0, 5000),
    speedKph: optNum(0, 30),
    harnessLoadN: optNum(0, 3000),
    workloadW: optNum(0, 1000),
    distanceKm: optNum(0, 200),
    movementPerformanceScore: optNum(0, 100),
    notes: optText(),
  })
  .superRefine((v, ctx) => {
    const allowed = { 'resistance-training': ['ARED', 'ROCKY'], treadmill: ['TREADMILL'], 'cycle-ergometer': ['CEVIS'], functional: ['ARED', 'ROCKY', 'TREADMILL', 'CEVIS', 'NONE'] }[v.category];
    if (!allowed.includes(v.equipment)) ctx.addIssue({ code: 'custom', path: ['equipment'], message: 'Equipment does not match the exercise category' });
    if (v.completionStatus === 'missed' && v.durationMinutes) ctx.addIssue({ code: 'custom', path: ['durationMinutes'], message: 'A missed session cannot have a duration' });
  });

export const sensorFormSchema = z.object({
  astronautId: z.string().min(1, 'Select an astronaut'),
  sensorType: z.enum(['IMU', 'FORCE', 'PRESSURE']),
  metric: z.string().min(1, 'Select a metric'),
  value: z.preprocess((v) => (v === '' ? NaN : Number(v)), z.number({ invalid_type_error: 'Enter a number' }).finite('Enter a number')),
  timestamp: z.string().min(8, 'Enter a timestamp'),
  missionPhase: z.enum(['preflight', 'in-flight', 'postflight']),
  exerciseSessionId: optText(80),
  notes: optText(1000),
});

export const alertFormSchema = z.object({
  astronautId: z.string().min(1, 'Select an astronaut'),
  category: z.enum(['performance-change', 'loading-change', 'exercise-adherence', 'functional-change', 'specialist-review']),
  severity: z.enum(['info', 'attention', 'critical']),
  relatedMetric: optText(80),
  description: z.string().trim().min(5, 'Describe the alert (at least 5 characters)').max(1000),
});

export const reportFormSchema = z.object({
  reportType: z.string().min(1),
  astronautId: z.string().optional(),
  missionId: z.string().optional(),
  missionPhase: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  equipment: z.string().optional(),
  category: z.string().optional(),
  metric: z.string().optional(),
  title: z.string().max(120).optional(),
});
