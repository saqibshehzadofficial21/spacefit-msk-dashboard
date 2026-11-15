import { formatNumber, formatPercent, formatDate } from '../../utils/formatters.js';
import { METRICS, METRIC_KEYS } from '../../utils/constants.js';
import StatusBadge from '../common/StatusBadge.jsx';

/**
 * Side-by-side comparison of one baseline record and one later measurement for the SAME astronaut.
 * Percentages are shown only where mathematically valid (non-zero baseline).
 */
export default function PerformanceComparison({ baseline, current }) {
  if (!baseline || !current) {
    return <p className="text-sm text-slate-400">Select a baseline and a measurement to compare.</p>;
  }
  if (baseline.astronautId !== current.astronautId) {
    return <p role="alert" className="text-sm text-red-300">Baseline and measurement belong to different astronauts. Comparison is blocked.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-700/40">
      <table className="min-w-full divide-y divide-slate-800">
        <caption className="sr-only">Baseline comparison for {current.astronautId}</caption>
        <thead className="bg-space-900/70">
          <tr>
            <th scope="col" className="table-th">Metric</th>
            <th scope="col" className="table-th text-right">Baseline ({formatDate(baseline.assessmentDate)})</th>
            <th scope="col" className="table-th text-right">Current ({formatDate(current.assessmentDate)})</th>
            <th scope="col" className="table-th text-right">Difference</th>
            <th scope="col" className="table-th text-right">% change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80 bg-space-850/40">
          {METRIC_KEYS.map((k) => {
            const def = METRICS[k];
            const b = baseline[k];
            const c = current[k];
            const bothMissing = b == null && c == null;
            const diff = b != null && c != null ? c - b : null;
            const pct = def.kind === 'percent' && b != null && c != null && b !== 0 ? ((c - b) / b) * 100 : null;
            return (
              <tr key={k} className={bothMissing ? 'text-muted' : ''}>
                <td className="table-td font-medium">{def.label}</td>
                <td className="table-td text-right tabular-nums">{b == null ? '—' : `${formatNumber(b, def.decimals)} ${def.unit}`}</td>
                <td className="table-td text-right tabular-nums">{c == null ? '—' : `${formatNumber(c, def.decimals)} ${def.unit}`}</td>
                <td className="table-td text-right tabular-nums">{diff === null ? '—' : `${diff > 0 ? '+' : ''}${formatNumber(diff, def.decimals)} ${def.unit}`}</td>
                <td className="table-td text-right tabular-nums">
                  {def.kind === 'points' ? <StatusBadge tone="neutral">points metric</StatusBadge> : pct === null ? <span className="text-xs text-slate-500">not valid</span> : <span className="font-semibold text-cyan-200">{formatPercent(pct)}</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
