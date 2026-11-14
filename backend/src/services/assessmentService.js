import { readCollection, transact } from '../storage/jsonStorage.js';
import { makeId, nowIso } from '../utils/ids.js';
import { notFound, AppError } from '../utils/AppError.js';
import { applyListQuery } from '../utils/query.js';
import { sortByDate } from '../utils/dateUtils.js';

/**
 * Factory for baseline and performance assessment stores. Both share the same metric fields
 * but differ in purpose: baselines are individual reference values, performance records are later
 * measurements compared against them.
 */
export function createAssessmentService({ collection, prefix, label }) {
  const ensureAstronaut = async (astronautId) => {
    const astronauts = await readCollection('astronauts');
    if (!astronauts.some((a) => a.id === astronautId)) throw new AppError(400, 'Validation failed', [`astronautId: astronaut "${astronautId}" does not exist`]);
  };

  return {
    async list(query) {
      const items = await readCollection(collection);
      return applyListQuery(items, {
        ...query,
        dateField: 'assessmentDate',
        filters: { astronautId: query.astronautId, missionPhase: query.missionPhase },
        searchFields: ['notes', 'astronautId'],
      });
    },
    async history(astronautId, query = {}) {
      const items = (await readCollection(collection)).filter((r) => r.astronautId === astronautId);
      return sortByDate(items).map((r) => ({ ...r })).filter((r) => !query.missionPhase || query.missionPhase === 'all' || r.missionPhase === query.missionPhase);
    },
    async get(id) {
      const found = (await readCollection(collection)).find((r) => r.id === id);
      if (!found) throw notFound(label, id);
      return found;
    },
    async create(input) {
      await ensureAstronaut(input.astronautId);
      return transact(collection, (items) => {
        const now = nowIso();
        const record = { ...input, id: makeId(prefix), dataSource: 'manual', createdAt: now, updatedAt: now };
        items.push(record);
        return record;
      });
    },
    async update(id, patch) {
      return transact(collection, (items) => {
        const i = items.findIndex((r) => r.id === id);
        if (i < 0) throw notFound(label, id);
        items[i] = { ...items[i], ...patch, id, updatedAt: nowIso() };
        return items[i];
      });
    },
  };
}
