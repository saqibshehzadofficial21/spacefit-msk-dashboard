import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { alertService } from '../../services/alertService.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAppContext } from '../../context/AppContext.jsx';
import { useDebounce } from '../../hooks/useDebounce.js';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import DataTable from '../common/DataTable.jsx';
import Modal from '../common/Modal.jsx';
import Pagination from '../common/Pagination.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import ErrorState from '../common/ErrorState.jsx';
import { Field, Input, Select, SearchBox, Textarea } from '../common/Input.jsx';
import AlertDetails from './AlertDetails.jsx';
import { ALERT_CATEGORIES, ALERT_STATUSES, SEVERITIES } from '../../utils/constants.js';
import { formatDateTime, formatNumber, SEVERITY_TEXT, SEVERITY_TONE } from '../../utils/formatters.js';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { alertFormSchema } from '../../utils/validators.js';

/** Severity chips show counts for the current scope, acting as quick filters. */
export default function AlertsPanel({ astronautId = 'all' }) {
  const { can, notifyDataChanged, astronauts, filterParams } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const [severity, setSeverity] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const query = useMemo(() => ({
    q: debouncedQ || undefined,
    astronautId: astronautId === 'all' ? filterParams.astronautId : astronautId,
    severity, category, reviewStatus: status, page, pageSize: 12, sortBy: 'generatedAt', order: 'desc',
  }), [debouncedQ, astronautId, filterParams.astronautId, severity, category, status, page]);
  const key = JSON.stringify(query);
  const { data, meta, loading, error, reload } = useFetch(() => alertService.list(query), [key]);

  const counts = useFetch(() => alertService.list({ astronautId: astronautId === 'all' ? filterParams.astronautId : astronautId, pageSize: 200 }), [astronautId, filterParams.astronautId]);
  const countBySeverity = useMemo(() => {
    const out = { critical: 0, attention: 0, info: 0 };
    (counts.data ?? []).forEach((a) => { out[a.severity] = (out[a.severity] ?? 0) + 1; });
    return out;
  }, [counts.data]);

  // Deep link from dashboard "View details": /alerts?open=ALT-...
  const openId = searchParams.get('open');
  useEffect(() => {
    if (!openId) return;
    alertService.get(openId).then((r) => setSelected(r.data)).catch(() => toast.error('That alert could not be found'));
    const next = new URLSearchParams(searchParams);
    next.delete('open');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const columns = [
    { key: 'id', label: 'Alert ID', render: (a) => <span className="font-mono text-xs text-slate-400">{a.id.slice(0, 12)}…</span> },
    { key: 'astronautId', label: 'Astronaut', sortable: true, render: (a) => <span className="font-mono text-xs">{a.astronautId}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (a) => ALERT_CATEGORIES.find((c) => c.value === a.category)?.label ?? a.category },
    { key: 'severity', label: 'Severity', sortable: true, sortValue: (a) => ({ critical: 3, attention: 2, info: 1 }[a.severity] ?? 0), render: (a) => <StatusBadge tone={SEVERITY_TONE[a.severity]} dot>{SEVERITY_TEXT[a.severity] ?? a.severity}</StatusBadge> },
    { key: 'relatedMetric', label: 'Metric', render: (a) => <span className="line-clamp-1 max-w-[12rem]">{a.relatedMetric ?? '—'}</span> },
    { key: 'baselineValue', label: 'Baseline', align: 'right', render: (a) => (a.baselineValue == null ? '—' : formatNumber(a.baselineValue, 2)) },
    { key: 'currentValue', label: 'Current', align: 'right', render: (a) => (a.currentValue == null ? '—' : formatNumber(a.currentValue, 2)) },
    { key: 'generatedAt', label: 'Generated', sortable: true, render: (a) => <span className="whitespace-nowrap text-xs text-slate-400">{formatDateTime(a.generatedAt)}</span> },
    { key: 'reviewStatus', label: 'Status', sortable: true, render: (a) => <StatusBadge tone="info">{ALERT_STATUSES.find((s) => s.value === a.reviewStatus)?.label ?? a.reviewStatus}</StatusBadge> },
    { key: 'actions', label: 'Details', render: (a) => <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelected(a); }}>View details</Button> },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {SEVERITIES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => { setSeverity(severity === s.value ? 'all' : s.value); setPage(1); }}
            aria-pressed={severity === s.value}
            className={`glass flex items-center justify-between p-4 text-left transition hover:border-cyan-400/30 ${severity === s.value ? 'ring-2 ring-cyan-400/40' : ''}`}
          >
            <span>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</span>
              <span className="mt-1 block text-2xl font-bold tabular-nums text-white">{countBySeverity[s.value] ?? 0}</span>
            </span>
            <StatusBadge tone={SEVERITY_TONE[s.value]} dot>{s.label}</StatusBadge>
          </button>
        ))}
      </div>

      <Card
        title="Alert register"
        subtitle="Alerts are generated when a measurement breaches a configurable sample threshold. They are prompts for review, not diagnoses."
        actions={can('alerts:write') ? <Button icon={Plus} onClick={() => setCreating(true)}>New alert</Button> : null}
      >
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <SearchBox id="alert-search" value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search description or metric…" label="Search alerts" />
          <Select aria-label="Filter by severity" value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}>
            <option value="all">All severities</option>{SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
          <Select aria-label="Filter by category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="all">All categories</option>{ALERT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          <Select aria-label="Filter by review status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="all">All review statuses</option>{ALERT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </Select>
        </div>
        {error ? <ErrorState message={error} onRetry={reload} /> : (
          <>
            <DataTable columns={columns} rows={data ?? []} loading={loading} onRowClick={setSelected} emptyTitle="No alerts match these filters" emptyText="Run the analysis on Adaptive Insights, or clear the filters." />
            <Pagination meta={meta} onPage={setPage} />
          </>
        )}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Alert ${selected.id}` : 'Alert'} subtitle={selected ? ALERT_CATEGORIES.find((c) => c.value === selected.category)?.hint : ''} size="lg">
        {selected && <AlertDetails key={selected.id} alert={selected} onChanged={(next) => { setSelected(next); reload(); }} onDeleted={() => { setSelected(null); reload(); }} />}
      </Modal>

      <NewAlertModal open={creating} onClose={() => setCreating(false)} astronautId={astronautId} onSaved={() => { setCreating(false); reload(); notifyDataChanged(); }} astronauts={astronauts} />
    </div>
  );
}

function NewAlertModal({ open, onClose, astronautId, onSaved, astronauts }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(alertFormSchema),
    defaultValues: { astronautId: astronautId !== 'all' ? astronautId : '', category: 'specialist-review', severity: 'attention', relatedMetric: '', description: '' },
  });
  useEffect(() => { if (open) reset({ astronautId: astronautId !== 'all' ? astronautId : '', category: 'specialist-review', severity: 'attention', relatedMetric: '', description: '' }); }, [open, astronautId, reset]);

  const submit = async (values) => {
    try {
      await alertService.create(values);
      toast.success('Alert created');
      onSaved();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New specialist alert" subtitle="Use for observations that a specialist wants tracked. Stored as a manual entry." footer={(
      <><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="new-alert-form" loading={isSubmitting}>Create alert</Button></>
    )}>
      <form id="new-alert-form" onSubmit={handleSubmit(submit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Astronaut" htmlFor="na-ast" error={errors.astronautId?.message} className="sm:col-span-2">
          <Select id="na-ast" error={errors.astronautId} {...register('astronautId')}><option value="">Select…</option>{astronauts.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}</Select>
        </Field>
        <Field label="Category" htmlFor="na-cat" error={errors.category?.message}><Select id="na-cat" {...register('category')}>{ALERT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field>
        <Field label="Severity" htmlFor="na-sev" error={errors.severity?.message}><Select id="na-sev" {...register('severity')}>{SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select></Field>
        <Field label="Related metric" htmlFor="na-metric" error={errors.relatedMetric?.message} className="sm:col-span-2"><Input id="na-metric" placeholder="e.g. Force production" {...register('relatedMetric')} /></Field>
        <Field label="Description" htmlFor="na-desc" error={errors.description?.message} className="sm:col-span-2"><Textarea id="na-desc" error={errors.description} {...register('description')} /></Field>
      </form>
    </Modal>
  );
}
