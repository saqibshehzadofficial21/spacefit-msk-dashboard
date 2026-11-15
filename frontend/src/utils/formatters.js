const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });

export const formatDate = (value) => (value ? dateFmt.format(new Date(value)) : '—');
export const formatDateTime = (value) => (value ? `${dateTimeFmt.format(new Date(value))} UTC` : '—');
export const isoDay = (value) => (value ? new Date(value).toISOString().slice(0, 10) : '');

export function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  const number = Number(value);
  return (Object.is(number, -0) ? 0 : number).toLocaleString('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
}

export function formatSigned(value, digits = 1, suffix = '') {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return '—';
  let n = Number(value);
  if (Math.abs(n) < 0.5 * (10 ** -digits)) n = 0;
  if (Object.is(n, -0)) n = 0;
  return `${n > 0 ? '+' : ''}${n.toLocaleString('en-GB', { maximumFractionDigits: digits })}${suffix}`;
}

export const formatPercent = (value, digits = 1) => formatSigned(value, digits, '%');

export const SEVERITY_ORDER = { critical: 3, attention: 2, info: 1, normal: 0 };

export const SEVERITY_TONE = { critical: 'critical', attention: 'attention', info: 'info', normal: 'ok', none: 'neutral' };

export const SEVERITY_TEXT = { critical: 'Critical', attention: 'Attention', info: 'Info', normal: 'Normal', none: 'No data' };

export const STATUS_TONE = { new: 'attention', reviewed: 'info', acknowledged: 'info', resolved: 'ok', unreviewed: 'attention', 'referred-to-specialist': 'critical', active: 'ok', 'on-hold': 'attention', completed: 'info' };

export const DIRECTION_TEXT = { rising: 'Rising', falling: 'Falling', stable: 'Stable', 'insufficient-data': 'Insufficient data' };

export const truncate = (text, max = 160) => (text && text.length > max ? `${text.slice(0, max - 1)}…` : text ?? '');
