import { readCollection, transact } from '../storage/jsonStorage.js';
import { makeId, nowIso } from '../utils/ids.js';
import { AppError, notFound } from '../utils/AppError.js';

export async function listMissions() {
  return readCollection('missions');
}

export async function getMission(id) {
  const mission = (await readCollection('missions')).find((m) => m.id === id);
  if (!mission) throw notFound('Mission', id);
  return mission;
}

export async function createMission(input) {
  return transact('missions', (missions) => {
    if (input.id && missions.some((m) => m.id === input.id)) throw new AppError(409, `Mission "${input.id}" already exists`);
    const now = nowIso();
    const record = { ...input, id: input.id ?? makeId('MSN'), dataSource: 'manual', createdAt: now, updatedAt: now };
    missions.push(record);
    return record;
  });
}

export async function updateMission(id, patch) {
  return transact('missions', (missions) => {
    const i = missions.findIndex((m) => m.id === id);
    if (i < 0) throw notFound('Mission', id);
    missions[i] = { ...missions[i], ...patch, id, updatedAt: nowIso() };
    return missions[i];
  });
}
