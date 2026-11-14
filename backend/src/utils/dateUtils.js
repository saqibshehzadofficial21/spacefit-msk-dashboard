/** Parse "YYYY-MM-DD" or any ISO datetime; returns an ISO string or null. */
export function toIsoOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export const dayKey = (value) => new Date(value).toISOString().slice(0, 10);

/** Inclusive range check on ISO timestamps. Undefined bounds are open. */
export function inDateRange(value, start, end) {
  const t = new Date(value).getTime();
  if (Number.isNaN(t)) return false;
  if (start && t < new Date(start).getTime()) return false;
  if (end) {
    const endDate = new Date(end);
    // A date-only end bound includes the whole day.
    if (/^\d{4}-\d{2}-\d{2}$/.test(end)) endDate.setUTCHours(23, 59, 59, 999);
    if (t > endDate.getTime()) return false;
  }
  return true;
}

export const sortByDate = (items, key = 'assessmentDate') =>
  [...items].sort((a, b) => new Date(a[key]).getTime() - new Date(b[key]).getTime());
