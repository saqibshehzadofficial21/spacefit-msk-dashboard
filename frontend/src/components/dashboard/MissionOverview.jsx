import { useNavigate } from 'react-router-dom';
import DataTable from '../common/DataTable.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { DataSourceBadge } from '../common/StatusBadge.jsx';
import { formatDate, SEVERITY_TEXT, SEVERITY_TONE } from '../../utils/formatters.js';
import { PHASES } from '../../utils/constants.js';

const phaseLabel = (v) => PHASES.find((p) => p.value === v)?.label ?? 'Not available';

export default function MissionOverview({ rows, loading }) {
  const navigate = useNavigate();
  const columns = [
    { key: 'name', label: 'Astronaut', sortable: true, render: (r) => (
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-status-info-bg text-xs font-bold text-status-info">{r.initials}</span>
        <div className="min-w-0"><p className="max-w-40 truncate font-medium text-primary" title={r.name}>{r.name}</p><p className="font-mono text-xs text-muted">{r.id}</p><DataSourceBadge source={r.dataSource} /></div>
      </div>
    ) },
    { key: 'missionName', label: 'Mission', sortable: true, render: (r) => <span className="line-clamp-1 max-w-[14rem] text-secondary">{r.missionName}</span> },
    { key: 'missionPhase', label: 'Phase', sortable: true, render: (r) => <StatusBadge tone="info">{phaseLabel(r.missionPhase)}</StatusBadge> },
    { key: 'status', label: 'Status', sortable: true, render: (r) => <StatusBadge tone={r.status === 'active' ? 'ok' : r.status === 'on-hold' ? 'attention' : 'neutral'} dot>{r.status.replace('-', ' ')}</StatusBadge> },
    { key: 'latestAssessment', label: 'Last assessment', sortable: true, sortValue: (r) => r.latestAssessment?.date ?? '', render: (r) => <span className="whitespace-nowrap text-secondary">{r.latestAssessment ? formatDate(r.latestAssessment.date) : 'No data yet'}</span> },
    { key: 'latestPerformanceStatus', label: 'Latest result', sortable: true, sortValue: (r) => r.latestPerformanceStatus.severity, render: (r) => {
      const s = r.latestPerformanceStatus.severity;
      const tone = s === 'none' ? 'neutral' : s === 'info' ? 'ok' : SEVERITY_TONE[s];
      const label = s === 'none' ? 'No data yet' : s === 'info' ? 'Normal' : SEVERITY_TEXT[s];
      return <StatusBadge tone={tone}>{label}</StatusBadge>;
    } },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      onRowClick={(r) => navigate(`/astronauts/${r.id}`)}
      responsiveCards
      emptyTitle="No astronauts match these filters."
      emptyText="Try a wider date range or clear a mission or astronaut filter."
    />
  );
}
