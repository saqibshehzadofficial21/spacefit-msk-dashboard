import { z } from 'zod';
import { idField, isoDateField, missionPhase, optionalText } from './common.js';
import { SENSOR_METRICS } from '../analysis/metricCatalog.js';

const sensorTypes = Object.keys(SENSOR_METRICS);
const allMetrics = Object.values(SENSOR_METRICS).flatMap((s) => Object.keys(s.metrics));

export const sensorSchema = z
  .object({
    astronautId: idField,
    sensorType: z.enum(sensorTypes),
    metric: z.enum(allMetrics),
    value: z.number().finite().min(-100000).max(100000),
    timestamp: isoDateField,
    missionPhase,
    exerciseSessionId: idField.nullish().transform((v) => v ?? null),
    sourceType: z.enum(['manual', 'sample-import', 'simulated-stream']).default('manual'),
    notes: optionalText(1000),
  })
  .superRefine((v, ctx) => {
    if (!SENSOR_METRICS[v.sensorType]?.metrics[v.metric]) {
      ctx.addIssue({ code: 'custom', path: ['metric'], message: `Metric ${v.metric} is not supported by ${v.sensorType} sensors` });
    }
  });

export const sensorUpdateSchema = z.object({
  value: z.number().finite().min(-100000).max(100000).optional(),
  timestamp: isoDateField.optional(),
  missionPhase: missionPhase.optional(),
  exerciseSessionId: idField.nullish(),
  notes: optionalText(1000),
});

export const sampleImportSchema = z.object({
  astronautId: idField,
  // Sample file content in JSON array form, or a CSV string with header: timestamp,sensorType,metric,value,missionPhase
  csv: z.string().max(500000).optional(),
  records: z.array(z.record(z.any())).max(5000).optional(),
});

export const simulateSchema = z.object({
  astronautId: idField,
  sensorType: z.enum(sensorTypes),
  samples: z.number().int().min(1).max(500).default(50),
  missionPhase: missionPhase.default('in-flight'),
  declinePercent: z.number().min(0).max(50).default(0),
});
