import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatDateTime, SEVERITY_TONE, truncate } from '../../utils/formatters.js';
import { ALERT_CATEGORIES, ALERT_STATUSES } from '../../utils/constants.js';

export default function RecentAlerts({ alerts, astronauts = [] }) {
  if (!alerts.length) return <p className="rounded-lg bg-status-ok-bg p-3 text-sm font-medium text-status-ok">Nothing new to review.</p>;
  return (
    <>
      <ul className="flex flex-col gap-2.5">
      {alerts.slice(0, 5).map((a) => (
        <li key={a.id} className="min-w-0 rounded-xl border border-border-subtle bg-surface-sunken p-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge tone={SEVERITY_TONE[a.severity]}>{a.severity}</StatusBadge>
              <StatusBadge tone="neutral">{ALERT_CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category}</StatusBadge>
              <StatusBadge tone="info">{ALERT_STATUSES.find((s) => s.value === a.reviewStatus)?.label ?? a.reviewStatus}</StatusBadge>
            </div>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-secondary">{truncate(a.description, 180)}</p>
            <p className="mt-1 text-xs text-muted">{astronauts.find((person) => person.id === a.astronautId)?.name ?? a.astronautId} · {formatDateTime(a.generatedAt)}</p>
            <Link to={`/alerts?open=${a.id}`} className="mt-2 inline-block text-sm font-medium text-accent-link hover:underline">Review alert</Link>
          </div>
        </li>
      ))}
      </ul>
      {alerts.length > 5 && <Link to="/alerts" className="mt-3 inline-block text-sm font-medium text-accent-link hover:underline">View all alerts</Link>}
    </>
  );
}
