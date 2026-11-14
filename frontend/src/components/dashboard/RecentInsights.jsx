import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatDate, formatPercent, formatNumber, SEVERITY_TEXT, SEVERITY_TONE, truncate } from '../../utils/formatters.js';

export default function RecentInsights({ insights }) {
  if (!insights.length) return <p className="text-sm text-slate-400">No insights yet. Run the analysis from Adaptive Insights.</p>;
  return (
    <ul className="flex flex-col gap-3">
      {insights.map((i) => (
        <li key={i.id} className="rounded-xl border border-slate-700/50 bg-space-900/50 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-100">{i.metricName}</p>
            <StatusBadge tone={SEVERITY_TONE[i.severity]} dot>{SEVERITY_TEXT[i.severity]}</StatusBadge>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            <span className="font-mono text-slate-500">{i.astronautId}</span> · {formatDate(i.measurementDate)} · baseline {formatNumber(i.baselineValue, 2)} → current {formatNumber(i.currentValue, 2)} {i.unit}
            {i.percentChange !== null && i.percentChange !== undefined && <span className="ml-1 font-semibold text-cyan-200">({formatPercent(i.percentChange)})</span>}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">{truncate(i.explanation, 170)}</p>
          <Link to="/adaptive-insights" className="mt-2 inline-block text-xs font-medium text-cyan-300 hover:underline">Review details →</Link>
        </li>
      ))}
    </ul>
  );
}
