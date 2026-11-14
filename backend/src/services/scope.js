import { readCollection } from '../storage/jsonStorage.js';
import { inDateRange } from '../utils/dateUtils.js';

/**
 * Global filters shared by dashboard, reports and list pages.
 * missionId is resolved to the set of astronauts assigned to that mission.
 */
export async function resolveAstronautIds({ astronautId, missionId } = {}) {
  if (astronautId && astronautId !== 'all') return new Set([astronautId]);
  if (missionId && missionId !== 'all') {
    const astronauts = await readCollection('astronauts');
    return new Set(astronauts.filter((a) => a.missionId === missionId).map((a) => a.id));
  }
  return null; // no restriction
}

/** Complete (unpaginated) filtering of a record collection by astronaut set, mission phase and date window. */
export function scopeRecords(items, { astronautIds = null, missionPhase, startDate, endDate, dateField = 'sessionDate' } = {}) {
  return items.filter((item) => {
    if (astronautIds && !astronautIds.has(item.astronautId)) return false;
    if (missionPhase && missionPhase !== 'all' && item.missionPhase !== missionPhase) return false;
    if (startDate || endDate) return inDateRange(item[dateField], startDate, endDate);
    return true;
  });
}
