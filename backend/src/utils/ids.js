import { v4 as uuidv4 } from 'uuid';

/** Unique record ID: prefix + UUID v4 (e.g. EXR-3f2c...). */
export const makeId = (prefix) => `${prefix}-${uuidv4()}`;

/** Sequential, human-readable astronaut IDs (AST-001, AST-002 ...). Call inside a transaction. */
export function nextAstronautId(existing) {
  const max = existing.reduce((highest, record) => {
    const n = Number(String(record.id).replace(/^AST-/, ''));
    return Number.isFinite(n) && n > highest ? n : highest;
  }, 0);
  return `AST-${String(max + 1).padStart(3, '0')}`;
}

export const nowIso = () => new Date().toISOString();
