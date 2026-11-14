/** Client-side mirror of backend/src/utils/calculations.js, used for instant comparison views. */
export const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const round = (v, d = 2) => (isNum(v) ? Number(v.toFixed(d)) : null);

export const adherencePercent = (completed, prescribed) => (!prescribed ? null : round((completed / prescribed) * 100, 1));
export const difference = (current, baseline) => (isNum(current) && isNum(baseline) ? round(current - baseline, 3) : null);
export const percentChange = (current, baseline) => (isNum(current) && isNum(baseline) && baseline !== 0 ? round(((current - baseline) / baseline) * 100, 1) : null);
export const mean = (values) => {
  const clean = values.filter(isNum);
  return clean.length ? clean.reduce((s, v) => s + v, 0) / clean.length : null;
};

export function trend(values) {
  const clean = values.filter(isNum);
  if (clean.length < 3) return { direction: 'insufficient-data', slope: null };
  const n = clean.length;
  const xMean = (n - 1) / 2;
  const yMean = mean(clean);
  let num = 0;
  let den = 0;
  clean.forEach((y, x) => { num += (x - xMean) * (y - yMean); den += (x - xMean) ** 2; });
  const slope = den === 0 ? 0 : num / den;
  const relative = Math.abs(yMean) > 1e-9 ? Math.abs(slope / yMean) : 0;
  let direction = 'stable';
  if (relative > 0.005) direction = slope > 0 ? 'rising' : 'falling';
  return { direction, slope: round(slope, 4) };
}
