import { Eye, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../common/Button.jsx';
import DataTable from '../common/DataTable.jsx';
import StatusBadge, { DataSourceBadge } from '../common/StatusBadge.jsx';
import { formatDate } from '../../utils/formatters.js';
import { PHASES } from '../../utils/constants.js';

export default function AstronautTable({ rows, loading, canEdit, canDelete, onEdit, onDelete, onSearchReset }) {
  const navigate = useNavigate();
  const columns = [
    { key: 'id', label: 'ID', sortable: true, render: (a) => <span className="font-mono text-xs text-slate-300">{a.id}</span> },
    { key: 'name', label: 'Name', sortable: true, render: (a) => (
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-accent to-cyan-500 text-xs font-bold text-white">{a.initials}</span>
        <span className="font-medium text-slate-100">{a.name}</span>
      </div>
    ) },
    { key: 'missionName', label: 'Mission', sortable: true, render: (a) => <span className="line-clamp-1 max-w-[14rem]">{a.missionName}</span> },
    { key: 'missionPhase', label: 'Phase', sortable: true, render: (a) => <StatusBadge tone="info">{PHASES.find((p) => p.value === a.missionPhase)?.label}</StatusBadge> },
    { key: 'status', label: 'Status', sortable: true, render: (a) => <StatusBadge tone={a.status === 'active' ? 'ok' : a.status === 'on-hold' ? 'attention' : 'neutral'} dot>{a.status}</StatusBadge> },
    { key: 'dataSource', label: 'Record type', render: (a) => <DataSourceBadge source={a.dataSource} /> },
    { key: 'createdAt', label: 'Created', sortable: true, render: (a) => <span className="whitespace-nowrap text-xs text-slate-400">{formatDate(a.createdAt)}</span> },
    { key: 'actions', label: 'Actions', render: (a) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" icon={Eye} aria-label={`View ${a.name}`} onClick={() => navigate(`/astronauts/${a.id}`)}>View</Button>
        {canEdit && <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Edit ${a.name}`} onClick={() => onEdit(a)} />}
        {canDelete && <Button size="sm" variant="ghost" icon={Trash2} aria-label={`Delete ${a.name}`} onClick={() => onDelete(a)} />}
      </div>
    ) },
  ];
  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      onRowClick={(a) => navigate(`/astronauts/${a.id}`)}
      emptyTitle="No astronauts match"
      emptyText="Clear the search or filters, or add an astronaut."
      emptyAction={onSearchReset ? <Button variant="secondary" size="sm" onClick={onSearchReset}>Clear filters</Button> : null}
    />
  );
}
