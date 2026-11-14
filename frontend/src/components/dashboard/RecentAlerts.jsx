import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatDateTime, SEVERITY_TONE, truncate } from '../../utils/formatters.js';
import { ALERT_CATEGORIES, ALERT_STATUSES } from '../../utils/constants.js';

export default function RecentAlerts({ alerts }) {
  if (!alerts.length) return <p className="text-sm text-slate-400">No alerts have been generated.</p>;
  return (
    <ul className="flex flex-col gap-2.5">
      {alerts.map((a) => (
        <li key={a.id} className="flex gap-3 rounded-xl border border-slate-700/50 bg-space-900/50 p-3">
          <span className={`mt-1 h-auto w-1 shrink-0 rounded-full ${a.severity === 'critical' ? 'bg-red-500' : a.severity === 'attention' ? 'bg-amber-400' : 'bg-cyan-400'}`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge tone={SEVERITY_TONE[a.severity]}>{a.severity}</StatusBadge>
              <StatusBadge tone="neutral">{ALERT_CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category}</StatusBadge>
              <StatusBadge tone="info">{ALERT_STATUSES.find((s) => s.value === a.reviewStatus)?.label ?? a.reviewStatus}</StatusBadge>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{truncate(a.description, 120)}</p>
            <p className="mt-1 text-[11px] text-slate-500">{a.astronautId} · {formatDateTime(a.generatedAt)}</p>
            <Link to={`/alerts?open=${a.id}`} className="mt-1 inline-block text-xs font-medium text-cyan-300 hover:underline">View details</Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
