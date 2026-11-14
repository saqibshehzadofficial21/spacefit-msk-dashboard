/** Shared chart colours and tooltip styling. Gradients are used for accents only. */
export const COLORS = {
  grid: 'rgba(148,163,184,0.12)',
  axis: '#64748B',
  text: '#94A3B8',
  blue: '#3B82F6',
  cyan: '#38BDF8',
  violet: '#8B5CF6',
  ok: '#22C55E',
  warn: '#F59E0B',
  crit: '#EF4444',
  series: ['#38BDF8', '#3B82F6', '#A78BFA', '#22D3EE', '#818CF8', '#34D399', '#F472B6', '#FBBF24'],
};

export const tooltipStyle = {
  contentStyle: { background: '#101A2E', border: '1px solid rgba(56,189,248,0.25)', borderRadius: 12, color: '#E2E8F0', fontSize: 12 },
  labelStyle: { color: '#94A3B8', marginBottom: 4 },
  cursor: { stroke: 'rgba(56,189,248,0.35)', fill: 'rgba(56,189,248,0.06)' },
};

export const axisProps = { stroke: COLORS.axis, tick: { fill: COLORS.text, fontSize: 11 }, tickLine: false, axisLine: { stroke: COLORS.grid } };

export const shortDate = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
