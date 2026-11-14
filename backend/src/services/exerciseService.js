import { readCollection, transact } from '../storage/jsonStorage.js';
import { makeId, nowIso } from '../utils/ids.js';
import { notFound, AppError } from '../utils/AppError.js';
import { applyListQuery } from '../utils/query.js';

export async function listExercises(query) {
  const items = await readCollection('exerciseRecords');
  return applyListQuery(items, {
    ...query,
    dateField: 'sessionDate',
    filters: {
      astronautId: query.astronautId,
      missionPhase: query.missionPhase,
      category: query.category,
      equipment: query.equipment,
      completionStatus: query.completionStatus,
      prescribed: query.prescribed,
    },
    searchFields: ['notes', 'equipment', 'category', 'id'],
  });
}

export async function getExercise(id) {
  const found = (await readCollection('exerciseRecords')).find((r) => r.id === id);
  if (!found) throw notFound('Exercise record', id);
  return found;
}

async function ensureAstronaut(astronautId) {
  const astronauts = await readCollection('astronauts');
  if (!astronauts.some((a) => a.id === astronautId)) throw new AppError(400, 'Validation failed', [`astronautId: astronaut "${astronautId}" does not exist`]);
}

export async function createExercise(input) {
  await ensureAstronaut(input.astronautId);
  return transact('exerciseRecords', (items) => {
    const now = nowIso();
    const record = { ...input, id: makeId('EXR'), dataSource: 'manual', createdAt: now, updatedAt: now };
    items.push(record);
    return record;
  });
}

export async function updateExercise(id, patch) {
  return transact('exerciseRecords', (items) => {
    const i = items.findIndex((r) => r.id === id);
    if (i < 0) throw notFound('Exercise record', id);
    items[i] = { ...items[i], ...patch, id, updatedAt: nowIso() };
    return items[i];
  });
}

export async function deleteExercise(id) {
  return transact('exerciseRecords', (items) => {
    const i = items.findIndex((r) => r.id === id);
    if (i < 0) throw notFound('Exercise record', id);
    items.splice(i, 1);
    return { id };
  });
}
