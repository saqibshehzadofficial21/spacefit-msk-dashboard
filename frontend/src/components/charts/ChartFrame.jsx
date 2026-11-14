import { ResponsiveContainer } from 'recharts';

/** Responsive chart wrapper with an accessible text fallback when there is no data. */
export default function ChartFrame({ height = 280, hasData, emptyText = 'No stored records for this selection yet.', children, label }) {
  if (!hasData) {
    return (
      <div style={{ height }} className="grid place-items-center rounded-xl border border-dashed border-slate-700/60 bg-space-900/40 px-6 text-center text-sm text-slate-400" role="img" aria-label={`${label ?? 'Chart'}: no data`}>
        {emptyText}
      </div>
    );
  }
  return (
    <div style={{ height, width: '100%' }} role="img" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
    </div>
  );
}
