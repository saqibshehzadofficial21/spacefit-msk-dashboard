import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable.jsx';
import StatusBadge, { DataSourceBadge } from '../common/StatusBadge.jsx';
import { formatDate, SEVERITY_TEXT, SEVERITY_TONE } from '../../utils/formatters.js';
import { PHASES } from '../../utils/constants.js';

const phaseLabel = (v) => PHASES.find((p) => p.value === v)?.label ?? v;

export default function MissionOverview({ rows, loading }) {
  const navigate = useNavigate();
  const columns = [
    { key: 'name', label: 'Astronaut', sortable: true, render: (r) => (
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent to-cyan-500 text-xs font-bold text-white">{r.initials}</span>
        <div className="min-w-0"><p className="truncate font-medium text-slate-100">{r.name}</p><p className="font-mono text-[11px] text-slate-500">{r.id}</p></div>
      </div>
    ) },
    { key: 'missionName', label: 'Mission', sortable: true, render: (r) => <span className="line-clamp-1 max-w-[14rem] text-slate-300">{r.missionName}</span> },
    { key: 'missionPhase', label: 'Phase', sortable: true, render: (r) => <StatusBadge tone="info">{phaseLabel(r.missionPhase)}</StatusBadge> },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <StatusBadge tone={r.status === 'active' ? 'ok' : r.status === 'on-hold' ? 'attention' : 'neutral'} dot>{r.status}</StatusBadge> },
    { key: 'latestAssessment', label: 'Latest assessment', sortable: true, sortValue: (r) => r.latestAssessment?.date ?? '', render: (r) => <span className="whitespace-nowrap text-slate-300">{formatDate(r.latestAssessment?.date)}</span> },
    { key: 'latestPerformanceStatus', label: 'Performance status', sortable: true, sortValue: (r) => r.latestPerformanceStatus.severity, render: (r) => {
      const s = r.latestPerformanceStatus.severity;
      return <StatusBadge tone={s === 'none' ? 'neutral' : SEVERITY_TONE[s]} dot>{SEVERITY_TEXT[s]}{r.latestPerformanceStatus.metric ? ` · ${r.latestPerformanceStatus.metric}` : ''}</StatusBadge>;
    } },
    { key: 'dataSource', label: 'Data', render: (r) => <DataSourceBadge source={r.dataSource} /> },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      onRowClick={(r) => navigate(`/astronauts/${r.id}`)}
      emptyTitle="No astronauts in this filter"
      emptyText="Add an astronaut from the Astronauts page, or clear the global filters."
    />
  );
}
