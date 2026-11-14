import { readCollection, transact } from '../storage/jsonStorage.js';
import { nowIso, nextAstronautId } from '../utils/ids.js';

import { AppError, notFound } from '../utils/AppError.js';
import { applyListQuery } from '../utils/query.js';

const initialsOf = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');

/** Attach mission details (name, start and end dates) to an astronaut record. */
async function enrich(astronauts, missions) {
  const byId = new Map(missions.map((m) => [m.id, m]));
  return astronauts.map((a) => {
    const m = byId.get(a.missionId);
    return {
      ...a,
      missionName: m?.name ?? 'Unassigned',
      missionCode: m?.code ?? null,
      missionStartDate: m?.startDate ?? null,
      missionEndDate: m?.endDate ?? null,
    };
  });
}

export async function listAstronauts(query) {
  const [astronauts, missions] = await Promise.all([readCollection('astronauts'), readCollection('missions')]);
  const enriched = await enrich(astronauts, missions);
  return applyListQuery(enriched, {
    ...query,
    searchFields: ['name', 'id', 'missionName', 'missionCode'],
    filters: { missionId: query.missionId, missionPhase: query.missionPhase, status: query.status },
    sortBy: query.sortBy ?? 'name',
    order: query.order ?? 'asc',
  });
}

export async function getAstronaut(id) {
  const [astronauts, missions] = await Promise.all([readCollection('astronauts'), readCollection('missions')]);
  const found = astronauts.find((a) => a.id === id);
  if (!found) throw notFound('Astronaut', id);
  return (await enrich([found], missions))[0];
}

export async function createAstronaut(input) {
  const missions = await readCollection('missions');
  if (!missions.some((m) => m.id === input.missionId)) throw new AppError(400, 'Validation failed', [`missionId: mission "${input.missionId}" does not exist`]);
  const record = await transact('astronauts', (astronauts) => {
    const now = nowIso();
    const created = {
      id: nextAstronautId(astronauts),
      name: input.name,
      initials: initialsOf(input.name),
      missionId: input.missionId,
      missionPhase: input.missionPhase,
      status: input.status,
      notes: input.notes ?? null,
      dataSource: 'manual',
      createdAt: now,
      updatedAt: now,
    };
    astronauts.push(created);
    return created;
  });
  return getAstronaut(record.id);
}

export async function updateAstronaut(id, patch) {
  if (patch.missionId) {
    const missions = await readCollection('missions');
    if (!missions.some((m) => m.id === patch.missionId)) throw new AppError(400, 'Validation failed', [`missionId: mission "${patch.missionId}" does not exist`]);
  }
  await transact('astronauts', (astronauts) => {
    const i = astronauts.findIndex((a) => a.id === id);
    if (i < 0) throw notFound('Astronaut', id);
    const next = { ...astronauts[i], ...patch, id, updatedAt: nowIso() };
    if (patch.name) next.initials = initialsOf(patch.name);
    astronauts[i] = next;
  });
  return getAstronaut(id);
}

/** Delete an astronaut and every record that references them (cascade). Caller must confirm in the UI. */
export async function deleteAstronaut(id) {
  await getAstronaut(id);
  await transact('astronauts', (list) => {
    const i = list.findIndex((a) => a.id === id);
    list.splice(i, 1);
  });
  const cascade = ['baselineAssessments', 'performanceAssessments', 'exerciseRecords', 'sensorMeasurements', 'insights', 'alerts'];
  const removed = {};
  for (const key of cascade) {
    removed[key] = await transact(key, (items) => {
      const before = items.length;
      const kept = items.filter((r) => r.astronautId !== id);
      items.length = 0;
      items.push(...kept);
      return before - kept.length;
    });
  }
  return { id, removedRecords: removed };
}

