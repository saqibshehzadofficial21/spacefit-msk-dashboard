import { readCollection, transact } from '../storage/jsonStorage.js';
import { DEFAULT_SETTINGS } from '../config/storageConfig.js';
import { nowIso } from '../utils/ids.js';

const isPlain = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Deep merge that only overwrites keys present in the patch. */
export function deepMerge(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    target[key] = isPlain(value) && isPlain(target[key]) ? deepMerge({ ...target[key] }, value) : value;
  }
  return target;
}

export async function getSettings() {
  const stored = await readCollection('settings');
  // Stored values win; any missing key falls back to the documented default.
  return deepMerge(structuredClone(DEFAULT_SETTINGS), stored);
}

export async function updateSettings(patch) {
  await transact('settings', (settings) => {
    const merged = deepMerge(deepMerge(structuredClone(DEFAULT_SETTINGS), settings), patch);
    merged.thresholds.thresholdsNotice = DEFAULT_SETTINGS.thresholds.thresholdsNotice; // notice cannot be edited away
    merged.updatedAt = nowIso();
    Object.keys(settings).forEach((k) => delete settings[k]);
    Object.assign(settings, merged);
  });
  return getSettings();
}
