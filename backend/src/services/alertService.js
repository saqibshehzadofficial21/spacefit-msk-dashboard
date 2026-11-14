import { readCollection, transact } from '../storage/jsonStorage.js';
import { makeId, nowIso } from '../utils/ids.js';
import { notFound } from '../utils/AppError.js';
import { applyListQuery } from '../utils/query.js';

const SEVERITY_RANK = { critical: 3, attention: 2, info: 1 };

export async function listAlerts(query) {
  const items = await readCollection('alerts');
  const result = applyListQuery(items, {
    ...query,
    dateField: 'generatedAt',
    searchFields: ['description', 'relatedMetric', 'astronautId'],
    filters: { astronautId: query.astronautId, severity: query.severity, category: query.category, reviewStatus: query.reviewStatus },
  });
  return result;
}

export async function getAlert(id) {
  const found = (await readCollection('alerts')).find((a) => a.id === id);
  if (!found) throw notFound('Alert', id);
  return found;
}

export async function createAlert(input, actorRole) {
  return transact('alerts', (alerts) => {
    const now = nowIso();
    const record = {
      ...input,
      id: makeId('ALT'),
      source: 'manual',
      dataSource: 'manual',
      reviewStatus: 'new',
      relatedMetric: input.relatedMetric ?? null,
      baselineValue: null,
      currentValue: null,
      difference: null,
      generatedAt: now,
      specialistNotes: [],
      createdBy: actorRole,
      createdAt: now,
      updatedAt: now,
    };
    alerts.push(record);
    return record;
  });
}

export async function updateAlert(id, { reviewStatus, specialistNote }, actorRole) {
  return transact('alerts', (alerts) => {
    const i = alerts.findIndex((a) => a.id === id);
    if (i < 0) throw notFound('Alert', id);
    const alert = alerts[i];
    const now = nowIso();
    const notes = [...(alert.specialistNotes ?? [])];
    if (specialistNote) notes.push({ id: makeId('NOTE'), at: now, role: actorRole, text: specialistNote });
    alerts[i] = {
      ...alert,
      reviewStatus: reviewStatus ?? alert.reviewStatus,
      specialistNotes: notes,
      resolvedAt: (reviewStatus ?? alert.reviewStatus) === 'resolved' ? alert.resolvedAt ?? now : null,
      updatedAt: now,
    };
    return alerts[i];
  });
}

export async function deleteAlert(id) {
  return transact('alerts', (alerts) => {
    const i = alerts.findIndex((a) => a.id === id);
    if (i < 0) throw notFound('Alert', id);
    alerts.splice(i, 1);
    return { id };
  });
}

export { SEVERITY_RANK };
