import { transact, readCollection } from '../storage/jsonStorage.js';
import { makeId, nowIso } from '../utils/ids.js';

const MAX_ENTRIES = 1000;

/** Append-only audit trail (capped at the most recent 1000 entries). Failures here never block the user action. */
export async function recordAudit({ role, action, entity, entityId, summary }) {
  try {
    await transact('auditLogs', (logs) => {
      logs.push({ id: makeId('AUD'), timestamp: nowIso(), role, action, entity, entityId, summary });
      if (logs.length > MAX_ENTRIES) logs.splice(0, logs.length - MAX_ENTRIES);
    });
  } catch (err) {
    console.error('[audit] could not write audit entry:', err.message);
  }
}

export async function listAudit(limit = 100) {
  const logs = await readCollection('auditLogs');
  return [...logs].reverse().slice(0, limit);
}
