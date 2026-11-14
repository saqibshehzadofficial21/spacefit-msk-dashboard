import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { COLLECTIONS, DEFAULT_SETTINGS } from '../config/storageConfig.js';

/**
 * JSON file persistence layer.
 * - Reads go through fs/promises and never return partially-written data (writes are atomic renames).
 * - Writes are serialised per file with an in-process lock (read-modify-write is one critical section).
 * - Missing files are initialised with empty defaults; corrupted files are NOT overwritten, so the
 *   request fails with a clear STORAGE error instead of silently losing data.
 */
export class StorageError extends Error {
  constructor(message, { code = 'STORAGE_ERROR', file, cause } = {}) {
    super(message, { cause });
    this.name = 'StorageError';
    this.code = code;
    this.file = file;
  }
}

const locks = new Map();
const noop = () => {};

function withLock(key, task) {
  const previous = locks.get(key) ?? Promise.resolve();
  const run = previous.then(task);
  const tail = run.then(noop, noop);
  locks.set(key, tail);
  tail.then(() => {
    if (locks.get(key) === tail) locks.delete(key);
  });
  return run;
}

const defaultFor = (key) =>
  key === 'settings' ? structuredClone(DEFAULT_SETTINGS) : COLLECTIONS[key].type === 'array' ? [] : {};

function filePathFor(key) {
  const def = COLLECTIONS[key];
  if (!def) throw new StorageError(`Unknown data collection "${key}"`, { code: 'UNKNOWN_COLLECTION' });
  // Restrict to the known file names inside the data directory (no path traversal).
  return { file: def.file, full: path.join(env.dataDir, path.basename(def.file)) };
}

function validateShape(key, parsed, file) {
  const expected = COLLECTIONS[key].type;
  const ok = expected === 'array' ? Array.isArray(parsed) : parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed);
  if (!ok) throw new StorageError(`${file} has an unexpected structure`, { code: 'INVALID_STRUCTURE', file });
}

/** Read a collection. Missing file -> default value. Corrupt file -> StorageError (never overwritten). */
export async function readCollection(key) {
  const { file, full } = filePathFor(key);
  let raw;
  try {
    raw = await fs.readFile(full, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return defaultFor(key);
    throw new StorageError(`Unable to read ${file}`, { code: 'READ_FAILED', file, cause: err });
  }
  if (!raw.trim()) return defaultFor(key);
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new StorageError(
      `${file} contains invalid JSON. The file was left untouched; restore it from a backup or run "npm run seed" to regenerate demo data.`,
      { code: 'CORRUPT_JSON', file, cause: err },
    );
  }
  validateShape(key, parsed, file);
  return parsed;
}

/** Atomic write: write a temporary file, fsync, then rename over the target. */
export async function writeCollection(key, value) {
  const { file, full } = filePathFor(key);
  const tmp = `${full}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  const body = `${JSON.stringify(value, null, 2)}\n`;
  try {
    await fs.mkdir(env.dataDir, { recursive: true });
    const handle = await fs.open(tmp, 'w');
    try {
      await handle.writeFile(body, 'utf8');
      await handle.sync();
    } finally {
      await handle.close();
    }
    await fs.rename(tmp, full);
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => {});
    throw new StorageError(`Unable to write ${file}`, { code: 'WRITE_FAILED', file, cause: err });
  }
}

/**
 * Run a read-modify-write transaction on one collection.
 * The mutator receives the current data, mutates it and returns a result.
 * If the mutator throws, nothing is written.
 */
export function transact(key, mutator) {
  return withLock(key, async () => {
    const data = await readCollection(key);
    const result = await mutator(data);
    await writeCollection(key, data);
    return result;
  });
}

/** Ensure every required JSON file exists and is readable at startup. */
export async function initialiseStorage() {
  await fs.mkdir(env.dataDir, { recursive: true });
  const report = [];
  for (const key of Object.keys(COLLECTIONS)) {
    const { full, file } = filePathFor(key);
    try {
      await fs.access(full);
      await readCollection(key); // validates JSON and structure
      report.push({ file, status: 'ok' });
    } catch (err) {
      if (err instanceof StorageError && err.code === 'READ_FAILED') throw err;
      if (err.code === 'ENOENT' || err.code === 'EACCES') {
        report.push({ file, status: err.code === 'ENOENT' ? 'created' : 'unreadable' });
        if (err.code === 'ENOENT') await writeCollection(key, defaultFor(key));
      } else {
        report.push({ file, status: 'corrupted', message: err.message });
      }
    }
  }
  return report;
}

/** Non-throwing status used by /api/health and the Settings page. */
export async function storageStatus() {
  const files = [];
  for (const key of Object.keys(COLLECTIONS)) {
    const { file, full } = filePathFor(key);
    try {
      const stat = await fs.stat(full);
      await readCollection(key);
      files.push({ file, status: 'ok', bytes: stat.size });
    } catch (err) {
      files.push({ file, status: err.code === 'ENOENT' ? 'missing' : 'error', message: err.message });
    }
  }
  return {
    dataDir: path.basename(env.dataDir) === 'data' ? 'backend/data' : 'custom DATA_DIR (path hidden)',
    healthy: files.every((f) => f.status === 'ok' || f.status === 'missing'),
    files,
  };
}
