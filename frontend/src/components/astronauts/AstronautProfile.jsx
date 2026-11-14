import { formatDate } from '../../utils/formatters.js';
import { PHASES, DATA_SOURCE_LABELS } from '../../utils/constants.js';
import StatusBadge, { DataSourceBadge } from '../common/StatusBadge.jsx';
import Card from '../common/Card.jsx';

/** Personal mission information for one astronaut. Minimal personal data: name, IDs, mission and status. */
export default function AstronautProfile({ astronaut }) {
  const phase = PHASES.find((p) => p.value === astronaut.missionPhase)?.label;
  const items = [
    ['Astronaut ID', <span key="i" className="font-mono">{astronaut.id}</span>],
    ['Mission ID', <span key="m" className="font-mono">{astronaut.missionId}</span>],
    ['Mission name', astronaut.missionName],
    ['Mission start', formatDate(astronaut.missionStartDate)],
    ['Mission end', astronaut.missionEndDate ? formatDate(astronaut.missionEndDate) : 'Ongoing / not set'],
    ['Current mission phase', phase],
    ['Created', formatDate(astronaut.createdAt)],
    ['Record type', <DataSourceBadge key="d" source={astronaut.dataSource} />],
  ];
  return (
    <Card title="Personal mission information" subtitle={DATA_SOURCE_LABELS[astronaut.dataSource]} actions={<StatusBadge tone={astronaut.status === 'active' ? 'ok' : 'neutral'} dot>{astronaut.status}</StatusBadge>}>
      <dl className="grid gap-3 sm:grid-cols-2">
        {items.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-slate-800 bg-space-900/40 px-3 py-2">
            <dt className="label-muted">{k}</dt>
            <dd className="mt-1 text-sm text-slate-100">{v}</dd>
          </div>
        ))}
      </dl>
      {astronaut.notes && (
        <div className="mt-4 rounded-xl border border-slate-700/50 bg-space-900/50 p-4">
          <p className="label-muted mb-1">Notes</p>
          <p className="text-sm leading-relaxed text-slate-300">{astronaut.notes}</p>
        </div>
      )}
    </Card>
  );
}
