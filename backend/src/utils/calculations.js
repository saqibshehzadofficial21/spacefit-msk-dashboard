/**
 * Pure, reusable calculation utilities. No I/O here so they are easy to unit test.
 */
const round = (value, digits = 2) => (value === null || value === undefined || Number.isNaN(value) ? null : Number(value.toFixed(digits)));

/** Adherence = (completed prescribed / prescribed) * 100. Zero prescribed returns null (never NaN/Infinity). */
export function adherencePercent(completed, prescribed) {
  if (!prescribed || prescribed <= 0) return null;
  return round((completed / prescribed) * 100, 1);
}

/** Difference = current - baseline. Null when either side is missing. */
export function difference(current, baseline) {
  if (!isNum(current) || !isNum(baseline)) return null;
  return round(current - baseline, 3);
}

/** Percentage change = ((current - baseline) / baseline) * 100. Null for zero/missing baseline. */
export function percentChange(current, baseline) {
  if (!isNum(current) || !isNum(baseline) || baseline === 0) return null;
  return round(((current - baseline) / baseline) * 100, 1);
}

export function mean(values) {
  const clean = values.filter(isNum);
  if (!clean.length) return null;
  return clean.reduce((sum, v) => sum + v, 0) / clean.length;
}

/**
 * Linear trend over chronologically ordered values.
 * Returns the slope per step, and a direction label. Requires at least 3 points.
 */
export function trend(values) {
  const clean = values.filter(isNum);
  if (clean.length < 3) return { direction: 'insufficient-data', slope: null, points: clean.length };
  const n = clean.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(clean);
  let num = 0;
  let den = 0;
  clean.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  const slope = den === 0 ? 0 : num / den;
  const relative = Math.abs(yMean) > 1e-9 ? Math.abs(slope / yMean) : 0;
  let direction = 'stable';
  if (relative > 0.005) direction = slope > 0 ? 'rising' : 'falling';
  return { direction, slope: round(slope, 4), points: n };
}

export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
export { round };
