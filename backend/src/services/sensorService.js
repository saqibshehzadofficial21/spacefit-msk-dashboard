import { readCollection, transact } from '../storage/jsonStorage.js';
import { makeId, nowIso } from '../utils/ids.js';
import { notFound, AppError } from '../utils/AppError.js';
import { applyListQuery } from '../utils/query.js';
import { unitFor, SENSOR_METRICS } from '../analysis/metricCatalog.js';
import { adapters } from '../sensors/adapters/index.js';
import { sensorSchema } from '../validators/sensorValidator.js';

const ZERO_BASELINE_LOOKUP = { acceleration: null };
const BASELINE_KEY_FOR = { movementVelocity: 'movementVelocity', jointAngle: 'jointROM', appliedForce: 'forceProduction' };

export async function listSensors(query) {
  const items = await readCollection('sensorMeasurements');
  return applyListQuery(items, {
    ...query,
    dateField: 'timestamp',
    filters: { astronautId: query.astronautId, sensorType: query.sensorType, metric: query.metric, missionPhase: query.missionPhase, exerciseSessionId: query.exerciseSessionId, dataSource: query.dataSource },
    searchFields: ['notes', 'metric', 'sensorType'],
  });
}

export async function getSensor(id) {
  const found = (await readCollection('sensorMeasurements')).find((r) => r.id === id);
  if (!found) throw notFound('Sensor measurement', id);
  return found;
}

async function ensureAstronaut(astronautId) {
  const astronauts = await readCollection('astronauts');
  if (!astronauts.some((a) => a.id === astronautId)) throw new AppError(400, 'Validation failed', [`astronautId: astronaut "${astronautId}" does not exist`]);
}

/** Validate normalised records and convert to storage shape. Returns { valid, rejected }. */
function prepare(rawRecords) {
  const valid = [];
  const rejected = [];
  rawRecords.forEach((raw, index) => {
    const result = sensorSchema.safeParse({ ...raw, value: raw.value });
    if (!result.success) {
      rejected.push({ row: index + 1, errors: result.error.issues.map((i) => `${i.path.join('.') || 'row'}: ${i.message}`) });
      return;
    }
    const now = nowIso();
    valid.push({
      ...result.data,
      id: makeId('SEN'),
      // Provenance is carried from the adapter (manual / simulated). Never silently dropped.
      dataSource: raw.dataSource === 'simulated' ? 'simulated' : 'manual',
      unit: unitFor(result.data.sensorType, result.data.metric),
      notes: result.data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
  });
  return { valid, rejected };
}

async function insertMany(records) {
  if (!records.length) return;
  await transact('sensorMeasurements', (items) => {
    items.push(...records);
  });
}

export async function createSensor(input) {
  await ensureAstronaut(input.astronautId);
  const [record] = await adapters.manual.read(input);
  const { valid, rejected } = prepare([record]);
  if (rejected.length) throw new AppError(400, 'Validation failed', rejected[0].errors);
  await insertMany(valid);
  return valid[0];
}

export async function updateSensor(id, patch) {
  return transact('sensorMeasurements', (items) => {
    const i = items.findIndex((r) => r.id === id);
    if (i < 0) throw notFound('Sensor measurement', id);
    items[i] = { ...items[i], ...patch, id, updatedAt: nowIso() };
    return items[i];
  });
}

export async function deleteSensor(id) {
  return transact('sensorMeasurements', (items) => {
    const i = items.findIndex((r) => r.id === id);
    if (i < 0) throw notFound('Sensor measurement', id);
    items.splice(i, 1);
    return { id };
  });
}

/** Import fictional sample data. Invalid rows are rejected individually and reported; valid rows are saved. */
export async function importSamples(input) {
  await ensureAstronaut(input.astronautId);
  let raw;
  try {
    raw = await adapters.sampleImport.read(input);
  } catch (err) {
    throw new AppError(400, 'Sample import failed', [err.message]);
  }
  const { valid, rejected } = prepare(raw);
  await insertMany(valid);
  return { imported: valid.length, rejected: rejected.length, rejectedRows: rejected.slice(0, 20), dataSource: 'simulated' };
}

/** Generate a simulated sensor stream for demonstration. Always labelled simulated. */
export async function simulateStream(input) {
  await ensureAstronaut(input.astronautId);
  const metricsForSensor = Object.keys(SENSOR_METRICS[input.sensorType].metrics);
  const metric = input.metric && metricsForSensor.includes(input.metric) ? input.metric : metricsForSensor[0];
  const baselines = await readCollection('baselineAssessments');
  const baselineKey = BASELINE_KEY_FOR[metric];
  const latestBaseline = baselineKey
    ? baselines.filter((b) => b.astronautId === input.astronautId && typeof b[baselineKey] === 'number').sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate))[0]
    : null;
  const raw = await adapters.simulated.read({ ...input, metric, referenceValue: latestBaseline?.[baselineKey] ?? ZERO_BASELINE_LOOKUP[metric] ?? undefined });
  const { valid, rejected } = prepare(raw);
  await insertMany(valid);
  return { generated: valid.length, rejected: rejected.length, metric, dataSource: 'simulated', referenceSource: latestBaseline ? 'latest individual baseline for this metric' : 'fixed demonstration constant (no baseline for this metric)' };
}
