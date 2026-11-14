import { formatDate, formatNumber } from '../../utils/formatters.js';
import { METRICS, METRIC_KEYS, PHASES } from '../../utils/constants.js';
import DataTable from '../common/DataTable.jsx';
import { DataSourceBadge } from '../common/StatusBadge.jsx';

/** Table of stored assessments for one astronaut. Only measured metrics are shown as values. */
export default function PerformanceHistory({ records, onEdit, canEdit, loading, metricKeys = METRIC_KEYS }) {
  const columns = [
    { key: 'assessmentDate', label: 'Date', sortable: true, render: (r) => <span className="whitespace-nowrap">{formatDate(r.assessmentDate)}</span> },
    { key: 'missionPhase', label: 'Phase', sortable: true, render: (r) => PHASES.find((p) => p.value === r.missionPhase)?.label ?? r.missionPhase },
    ...metricKeys.map((k) => ({
      key: k,
      label: METRICS[k].label,
      align: 'right',
      sortable: true,
      render: (r) => (r[k] == null ? <span className="text-slate-600">—</span> : `${formatNumber(r[k], METRICS[k].decimals)}`),
    })),
    { key: 'functionalResult', label: 'Functional', render: (r) => (r.functionalResult ?? 'not-assessed').replace(/-/g, ' ') },
    { key: 'dataSource', label: 'Source', render: (r) => <DataSourceBadge source={r.dataSource} /> },
    ...(canEdit ? [{ key: 'edit', label: '', render: (r) => <button type="button" className="btn-ghost px-2 py-1 text-xs" onClick={(e) => { e.stopPropagation(); onEdit(r); }}>Edit</button> }] : []),
  ];
  return <DataTable columns={columns} rows={records} loading={loading} compact emptyTitle="No assessments recorded" emptyText="Record a baseline or performance assessment to populate this table." />;
}
