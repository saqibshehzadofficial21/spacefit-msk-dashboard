/** Shared chart colours and tooltip styling. */
export const COLORS = {
  grid: 'var(--chart-grid)',
  axis: 'var(--chart-axis)',
  text: 'var(--chart-axis)',
  blue: 'var(--chart-blue)',
  cyan: 'var(--chart-cyan)',
  violet: 'var(--chart-violet)',
  ok: 'var(--chart-green)',
  warn: 'var(--chart-amber)',
  crit: 'var(--chart-red)',
  series: ['var(--chart-blue)', 'var(--chart-cyan)', 'var(--chart-violet)', 'var(--chart-green)', 'var(--chart-amber)', 'var(--chart-red)'],
};

export const tooltipStyle = {
  contentStyle: { background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 12 },
  labelStyle: { color: 'var(--text-muted)', marginBottom: 4 },
  cursor: { stroke: 'rgba(59,130,246,0.35)', fill: 'rgba(59,130,246,0.08)' },
};

export const axisProps = { stroke: COLORS.axis, tick: { fill: COLORS.text, fontSize: 12 }, tickLine: false, axisLine: { stroke: COLORS.grid } };

export const shortDate = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
