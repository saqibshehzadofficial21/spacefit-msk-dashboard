import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatDate, SEVERITY_TEXT, SEVERITY_TONE, truncate } from '../../utils/formatters.js';

export default function RecentInsights({ insights, astronauts = [], simulated = false }) {
  if (!insights.length) return <p className="text-sm text-muted">Nothing new to review.</p>;
  return (
    <>
      <ul className="flex flex-col gap-3">
      {[...insights].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt)).slice(0, 5).map((i) => (
        <li key={i.id} className="rounded-xl border border-border-subtle bg-surface-sunken p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-primary">{i.metricName}</p>
            <div className="flex flex-wrap gap-1">
              <StatusBadge tone={SEVERITY_TONE[i.severity]} dot>{SEVERITY_TEXT[i.severity]}</StatusBadge>
              {simulated && <StatusBadge tone="violet">Simulated</StatusBadge>}
            </div>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-secondary">{truncate(i.explanation, 170)}</p>
          <p className="mt-2 text-xs text-muted">{astronauts.find((person) => person.id === i.astronautId)?.name ?? i.astronautId} · {formatDate(i.measurementDate)}</p>
          <Link to="/adaptive-insights" className="mt-2 inline-block text-sm font-medium text-accent-link hover:underline">View details</Link>
        </li>
      ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Rule-based. Describes a measurement difference only.</p>
      {insights.length > 5 && <Link to="/adaptive-insights" className="mt-2 inline-block text-sm font-medium text-accent-link hover:underline">View all insights</Link>}
    </>
  );
}
