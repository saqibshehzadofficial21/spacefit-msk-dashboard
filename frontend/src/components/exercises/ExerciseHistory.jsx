import { useMemo, useState } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { exerciseService } from '../../services/exerciseService.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { useAppContext } from '../../context/AppContext.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import DataTable from '../common/DataTable.jsx';
import ErrorState from '../common/ErrorState.jsx';
import Modal from '../common/Modal.jsx';
import Pagination from '../common/Pagination.jsx';
import StatusBadge, { DataSourceBadge } from '../common/StatusBadge.jsx';
import { Select, SearchBox } from '../common/Input.jsx';
import ExerciseForm from './ExerciseForm.jsx';
import { CATEGORIES, COMPLETION, EQUIPMENT, PHASES, CATEGORY_LABELS_BY_VALUE } from '../../utils/constants.js';
import { formatDate, formatNumber } from '../../utils/formatters.js';

const categoryLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label ?? v;

/** Load summary shown in the table. Only the fields relevant to each category are displayed. */
export function loadSummary(r) {
  switch (r.category) {
    case 'resistance-training': return r.resistanceKg == null ? '—' : `${formatNumber(r.resistanceKg, 1)} kg`;
    case 'treadmill': return r.speedKph == null ? '—' : `${formatNumber(r.speedKph, 1)} km/h${r.harnessLoadN == null ? '' : ` · ${formatNumber(r.harnessLoadN, 0)} N harness`}`;
    case 'cycle-ergometer': return r.workloadW == null ? '—' : `${formatNumber(r.workloadW, 0)} W${r.distanceKm == null ? '' : ` · ${formatNumber(r.distanceKm, 1)} km`}`;
    case 'functional': return r.movementPerformanceScore == null ? '—' : `Score ${formatNumber(r.movementPerformanceScore, 0)}`;
    default: return '—';
  }
}

/**
 * Exercise history for a category (or all categories). Filters: astronaut, category, equipment, status,
 * search, plus the global mission phase and date range from the top bar.
 */
export default function ExerciseHistory({ astronautId = 'all', category = 'all', title = 'Exercise history', subtitle }) {
  const { can, filterParams, astronauts, notifyDataChanged, filters } = useAppContext();
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const [equipment, setEquipment] = useState('all');
  const [completion, setCompletion] = useState('all');
  const [localAstronaut, setLocalAstronaut] = useState('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const effectiveAstronaut = astronautId !== 'all' ? astronautId : localAstronaut !== 'all' ? localAstronaut : filterParams.astronautId;
  const query = useMemo(() => ({
    q: debouncedQ || undefined,
    astronautId: effectiveAstronaut,
    category: category === 'all' ? undefined : category,
    equipment: equipment === 'all' ? undefined : equipment,
    completionStatus: completion === 'all' ? undefined : completion,
    missionPhase: filterParams.missionPhase,
    startDate: filterParams.startDate,
    endDate: filterParams.endDate,
    page, pageSize: 12, sortBy: 'sessionDate', order: 'desc',
  }), [debouncedQ, effectiveAstronaut, category, equipment, completion, filterParams, page]);
  const key = JSON.stringify(query);
  const { data, meta, loading, error, reload } = useFetch(() => exerciseService.list(query), [key]);

  const showResistanceColumns = category === 'all' || category === 'resistance-training';
  const columns = [
    { key: 'sessionDate', label: 'Date', sortable: true, render: (r) => <span className="whitespace-nowrap">{formatDate(r.sessionDate)}</span> },
    { key: 'astronautId', label: 'Astronaut', sortable: true, render: (r) => <span className="font-mono text-xs">{astronauts.find((a) => a.id === r.astronautId)?.name ?? r.astronautId}</span> },
    { key: 'equipment', label: 'Equipment', sortable: true, render: (r) => <StatusBadge tone="info">{r.equipment}</StatusBadge> },
    ...(category === 'all' ? [{ key: 'category', label: 'Category', sortable: true, render: (r) => categoryLabel(r.category) }] : []),
    { key: 'load', label: category === 'all' ? 'Load' : 'Resistance / workload', render: (r) => loadSummary(r) },
    ...(showResistanceColumns ? [
      { key: 'sets', label: 'Sets', align: 'right', render: (r) => (r.category === 'resistance-training' ? r.sets ?? '—' : '—') },
      { key: 'repetitions', label: 'Reps', align: 'right', render: (r) => (r.category === 'resistance-training' ? r.repetitions ?? '—' : '—') },
    ] : []),
    { key: 'durationMinutes', label: 'Duration', sortable: true, align: 'right', render: (r) => (r.durationMinutes == null ? '—' : `${formatNumber(r.durationMinutes, 0)} min`) },
    { key: 'completionStatus', label: 'Completion', sortable: true, render: (r) => <StatusBadge tone={r.completionStatus === 'completed' ? 'ok' : r.completionStatus === 'partial' ? 'attention' : 'critical'} dot>{r.completionStatus}{r.prescribed ? '' : ' · unplanned'}</StatusBadge> },
    { key: 'dataSource', label: 'Source', render: (r) => <DataSourceBadge source={r.dataSource} /> },
    { key: 'actions', label: 'Actions', render: (r) => (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" icon={Eye} aria-label={`View ${r.id}`} onClick={() => setViewing(r)} />
        {can('exercises:write') && <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Edit ${r.id}`} onClick={() => setEditing(r)} />}
        {can('exercises:write') && <Button size="sm" variant="ghost" icon={Trash2} aria-label={`Delete ${r.id}`} onClick={() => setDeleting(r)} />}
      </div>
    ) },
  ];

  const remove = async () => {
    setBusy(true);
    try {
      await exerciseService.remove(deleting.id);
      toast.success('Exercise record deleted');
      setDeleting(null);
      notifyDataChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title={title}
      subtitle={subtitle ?? `Showing ${CATEGORY_LABELS_BY_VALUE[category] ?? 'all categories'} · equipment-specific records`}
      actions={can('exercises:write') ? <Button icon={Plus} onClick={() => setCreating(true)}>Add exercise record</Button> : null}
    >
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        <SearchBox id={`ex-search-${category}`} value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search notes or IDs…" label="Search exercise records" />
        {astronautId === 'all' && (
          <Select aria-label="Filter by astronaut" value={localAstronaut} onChange={(e) => { setLocalAstronaut(e.target.value); setPage(1); }}>
            <option value="all">Astronaut from top bar</option>
            {astronauts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        )}
        <Select aria-label="Filter by equipment" value={equipment} onChange={(e) => { setEquipment(e.target.value); setPage(1); }}>
          <option value="all">All equipment</option>
          {EQUIPMENT.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
        </Select>
        <Select aria-label="Filter by completion" value={completion} onChange={(e) => { setCompletion(e.target.value); setPage(1); }}>
          <option value="all">All completion statuses</option>
          {COMPLETION.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Select>
      </div>
      <p className="mb-3 text-xs text-slate-500">Phase: {PHASES.find((p) => p.value === filters.missionPhase)?.label ?? 'All phases'} · dates follow the top-bar range.</p>

      {error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <DataTable columns={columns} rows={data ?? []} loading={loading} onRowClick={setViewing} emptyTitle="No exercise records match" emptyText="Add a record, or adjust the filters." />
          <Pagination meta={meta} onPage={setPage} />
        </>
      )}

      <ExerciseForm open={creating || !!editing} record={editing} astronautId={effectiveAstronaut} onClose={() => { setCreating(false); setEditing(null); }} onSaved={() => { setCreating(false); setEditing(null); reload(); }} />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Exercise session" subtitle={viewing ? `${categoryLabel(viewing.category)} · ${viewing.id}` : ''} size="md">
        {viewing && (
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Date', formatDate(viewing.sessionDate)],
              ['Astronaut', viewing.astronautId],
              ['Mission phase', PHASES.find((p) => p.value === viewing.missionPhase)?.label],
              ['Equipment', viewing.equipment],
              ['Prescribed', viewing.prescribed ? 'Yes' : 'No (unplanned)'],
              ['Completion', viewing.completionStatus],
              ['Load', loadSummary(viewing)],
              ['Duration', viewing.durationMinutes == null ? '—' : `${viewing.durationMinutes} min`],
              ['Sets × reps', viewing.sets == null ? '—' : `${viewing.sets} × ${viewing.repetitions ?? '—'}`],
              ['Data source', viewing.dataSource],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-slate-800 bg-space-900/40 px-3 py-2"><dt className="label-muted">{k}</dt><dd className="mt-1 text-sm text-slate-100">{v ?? '—'}</dd></div>
            ))}
            {viewing.notes && <p className="sm:col-span-2 text-sm text-slate-300">{viewing.notes}</p>}
          </dl>
        )}
      </Modal>

      <ConfirmDialog open={!!deleting} title="Delete exercise record?" message={`This removes the ${deleting ? categoryLabel(deleting.category) : ''} session from ${deleting ? formatDate(deleting.sessionDate) : ''}. Adherence figures will update.`} confirmLabel="Delete record" loading={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </Card>
  );
}

