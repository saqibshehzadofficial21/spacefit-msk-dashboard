import { useMemo, useState } from 'react';
import { Download, Pencil, Plus, Trash2, Upload, Wand2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { sensorService } from '../../services/sensorService.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAppContext } from '../../context/AppContext.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import ConfirmDialog from '../common/ConfirmDialog.jsx';
import DataTable from '../common/DataTable.jsx';
import ErrorState from '../common/ErrorState.jsx';
import Modal from '../common/Modal.jsx';
import Pagination from '../common/Pagination.jsx';
import StatusBadge, { DataSourceBadge } from '../common/StatusBadge.jsx';
import TrendChart from '../charts/TrendChart.jsx';
import { COLORS } from '../charts/chartTheme.js';
import { Field, Input, Select, SearchBox, Textarea } from '../common/Input.jsx';
import SensorForm from './SensorForm.jsx';
import { SENSOR_TYPES, PHASES } from '../../utils/constants.js';
import { formatDateTime, formatDate, formatNumber, isoDay } from '../../utils/formatters.js';
import { useDebounce } from '../../hooks/useDebounce.js';

const SAMPLE_CSV = `timestamp,sensorType,metric,value,missionPhase
2026-06-03T08:00:00Z,FORCE,appliedForce,121.4,in-flight
2026-06-03T08:05:00Z,PRESSURE,peakPressure,218.0,in-flight
2026-06-03T08:05:00Z,PRESSURE,loadBalance,49.5,in-flight
2026-06-05T08:00:00Z,IMU,movementVelocity,0.84,in-flight
2026-06-05T08:00:00Z,IMU,jointAngle,134.2,in-flight`;

/**
 * Sensor measurement records with filters, manual entry, fictional sample import, simulated streams and trends.
 * Every row shows its provenance. Simulated values are never presented as connected-hardware readings.
 */
export default function SensorPanel({ astronautId = 'all', title = 'Sensor measurements' }) {
  const { can, filterParams, astronauts, notifyDataChanged } = useAppContext();
  const [sensorType, setSensorType] = useState('all');
  const [metric, setMetric] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('');
  const debouncedSession = useDebounce(sessionFilter, 300);
  const [localAst, setLocalAst] = useState('all');
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState({ open: false, record: null });
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [simOpen, setSimOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sim, setSim] = useState({ sensorType: 'IMU', metric: 'movementVelocity', samples: 40, missionPhase: 'in-flight', declinePercent: 0 });

  const effAst = astronautId !== 'all' ? astronautId : localAst !== 'all' ? localAst : filterParams.astronautId;
  const query = useMemo(() => ({
    astronautId: effAst,
    sensorType: sensorType === 'all' ? undefined : sensorType,
    metric: metric === 'all' ? undefined : metric,
    exerciseSessionId: debouncedSession || undefined,
    missionPhase: filterParams.missionPhase,
    startDate: filterParams.startDate,
    endDate: filterParams.endDate,
    page, pageSize: 15, sortBy: 'timestamp', order: 'desc',
  }), [effAst, sensorType, metric, debouncedSession, filterParams, page]);
  const key = JSON.stringify(query);
  const { data, meta, loading, error, reload } = useFetch(() => sensorService.list(query), [key]);

  // Trend data: oldest first, a single metric for a single astronaut
  const trendQuery = { astronautId: effAst, sensorType: sensorType === 'all' ? undefined : sensorType, metric: metric === 'all' ? undefined : metric, missionPhase: filterParams.missionPhase, startDate: filterParams.startDate, endDate: filterParams.endDate, pageSize: 200, sortBy: 'timestamp', order: 'asc' };
  const trendEnabled = metric !== 'all' && effAst !== 'all';
  const trendFetch = useFetch(() => sensorService.list(trendQuery), [JSON.stringify(trendQuery)], { enabled: trendEnabled });
  const trendRows = (trendFetch.data ?? []).map((r) => ({ x: isoDay(r.timestamp), value: r.value }));
  const metricLabel = trendEnabled ? (SENSOR_TYPES[(trendFetch.data?.[0]?.sensorType) ?? sensorType]?.metrics?.[metric]?.[0] ?? metric) : '';
  const metricUnit = trendEnabled ? (trendFetch.data?.[0]?.unit ?? '') : '';

  const anySimulated = (data ?? []).some((r) => r.dataSource === 'simulated');

  const remove = async () => {
    setBusy(true);
    try {
      await sensorService.remove(deleting.id);
      toast.success('Sensor measurement deleted');
      setDeleting(null);
      notifyDataChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const runImport = async (payload) => {
    if (effAst === 'all') { toast.error('Select an astronaut first'); return; }
    setBusy(true);
    try {
      const res = await sensorService.importSamples({ astronautId: effAst, ...payload });
      const d = res.data;
      toast.success(`${d.imported} fictional row(s) imported as SIMULATED${d.rejected ? `, ${d.rejected} rejected` : ''}`);
      setImportOpen(false);
      notifyDataChanged();
    } catch (err) {
      toast.error(err.details?.length ? err.details.join(' · ') : err.message);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500000) { toast.error('File is larger than 500 KB'); return; }
    setCsvText(await file.text());
  };

  const runSimulation = async () => {
    if (effAst === 'all') { toast.error('Select an astronaut first'); return; }
    setBusy(true);
    try {
      const res = await sensorService.simulate({ astronautId: effAst, ...sim, samples: Number(sim.samples), declinePercent: Number(sim.declinePercent) });
      toast.success(`${res.data.generated} SIMULATED samples generated (${res.data.referenceSource})`);
      setSimOpen(false);
      notifyDataChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'timestamp', label: 'Timestamp', sortable: true, render: (r) => <span className="whitespace-nowrap text-xs">{formatDateTime(r.timestamp)}</span> },
    { key: 'astronautId', label: 'Astronaut', render: (r) => <span className="font-mono text-xs">{r.astronautId}</span> },
    { key: 'sensorType', label: 'Sensor', sortable: true, render: (r) => <StatusBadge tone="info">{r.sensorType}</StatusBadge> },
    { key: 'metric', label: 'Metric', render: (r) => SENSOR_TYPES[r.sensorType]?.metrics[r.metric]?.[0] ?? r.metric },
    { key: 'value', label: 'Value', sortable: true, align: 'right', render: (r) => <span className="tabular-nums">{formatNumber(r.value, 2)} <span className="text-xs text-slate-500">{r.unit}</span></span> },
    { key: 'missionPhase', label: 'Phase', render: (r) => PHASES.find((p) => p.value === r.missionPhase)?.label },
    { key: 'sourceType', label: 'Entry type', render: (r) => <span className="text-xs text-slate-400">{r.sourceType}</span> },
    { key: 'dataSource', label: 'Data source', render: (r) => <DataSourceBadge source={r.dataSource} /> },
    { key: 'actions', label: '', render: (r) => (
      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost" aria-label={`View ${r.id}`} onClick={() => setViewing(r)}>View</Button>
        {can('sensors:write') && r.dataSource === 'manual' && <Button size="sm" variant="ghost" icon={Pencil} aria-label={`Edit ${r.id}`} onClick={() => setFormState({ open: true, record: r })} />}
        {can('sensors:write') && <Button size="sm" variant="ghost" icon={Trash2} aria-label={`Delete ${r.id}`} onClick={() => setDeleting(r)} />}
      </div>
    ) },
  ];

  return (
    <div className="flex flex-col gap-5">
      <Card
        title={title}
        subtitle="IMU, force and pressure records. Each row shows whether it is manual or simulated."
        actions={can('sensors:write') ? (
          <>
            <Button variant="secondary" icon={Upload} onClick={() => setImportOpen(true)}>Import sample</Button>
            <Button variant="secondary" icon={Wand2} onClick={() => setSimOpen(true)}>Simulate stream</Button>
            <Button icon={Plus} onClick={() => setFormState({ open: true, record: null })}>Add measurement</Button>
          </>
        ) : null}
      >
        <div className="mb-4 grid gap-3 md:grid-cols-4">
          <SearchBox id="sensor-session" value={sessionFilter} onChange={(v) => { setSessionFilter(v); setPage(1); }} placeholder="Exercise session ID…" label="Filter by exercise session" />
          {astronautId === 'all' && (
            <Select aria-label="Filter by astronaut" value={localAst} onChange={(e) => { setLocalAst(e.target.value); setPage(1); }}>
              <option value="all">Astronaut from top bar</option>
              {astronauts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </Select>
          )}
          <Select aria-label="Filter by sensor type" value={sensorType} onChange={(e) => { setSensorType(e.target.value); setMetric('all'); setPage(1); }}>
            <option value="all">All sensor types</option>
            {Object.entries(SENSOR_TYPES).map(([k, v]) => <option key={k} value={k}>{k}</option>)}
          </Select>
          <Select aria-label="Filter by metric" value={metric} onChange={(e) => { setMetric(e.target.value); setPage(1); }}>
            <option value="all">All metrics</option>
            {Object.entries(SENSOR_TYPES).filter(([k]) => sensorType === 'all' || k === sensorType).flatMap(([, s]) => Object.entries(s.metrics)).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
          </Select>
        </div>

        {anySimulated && (
          <div role="note" className="mb-4 flex items-start gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 p-3 text-xs text-violet-100">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Some rows are SIMULATED demonstration values (fictional sample imports or generated streams). They are not measurements from connected hardware.
          </div>
        )}

        {error ? <ErrorState message={error} onRetry={reload} /> : (
          <>
            <DataTable columns={columns} rows={data ?? []} loading={loading} onRowClick={setViewing} emptyTitle="No sensor measurements match" emptyText="Add a measurement, import the fictional sample file, or generate a simulated stream." />
            <Pagination meta={meta} onPage={setPage} />
          </>
        )}
      </Card>

      {trendEnabled && (
        <Card title={`${metricLabel} trend`} subtitle={`${effAst} · ${trendFetch.data?.length ?? 0} record(s) in scope${metricUnit ? ` · unit ${metricUnit}` : ''}`}>
          <TrendChart data={trendRows} series={[{ key: 'value', label: metricLabel, color: COLORS.cyan }]} unit={metricUnit} label={`${metricLabel} sensor trend`} height={260} xFormatter={(v) => formatDate(v)} emptyText="No values for this metric in the current scope." />
        </Card>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Sensor measurement" subtitle={viewing?.id} size="md">
        {viewing && (
          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ['Astronaut', viewing.astronautId], ['Sensor type', viewing.sensorType], ['Metric', SENSOR_TYPES[viewing.sensorType]?.metrics[viewing.metric]?.[0]],
              ['Value', `${viewing.value} ${viewing.unit}`], ['Timestamp', formatDateTime(viewing.timestamp)], ['Mission phase', viewing.missionPhase],
              ['Exercise session', viewing.exerciseSessionId ?? '—'], ['Entry type', viewing.sourceType], ['Data source', viewing.dataSource],
            ].map(([k, v]) => <div key={k} className="rounded-lg border border-slate-800 bg-space-900/40 px-3 py-2"><dt className="label-muted">{k}</dt><dd className="mt-1 text-sm text-slate-100">{v}</dd></div>)}
            {viewing.notes && <p className="sm:col-span-2 text-sm text-slate-300">{viewing.notes}</p>}
          </dl>
        )}
      </Modal>

      <SensorForm open={formState.open} record={formState.record} astronautId={effAst} onClose={() => setFormState({ open: false, record: null })} onSaved={() => { setFormState({ open: false, record: null }); reload(); }} />

      <ConfirmDialog open={!!deleting} title="Delete sensor measurement?" message="This removes the measurement from storage. Derived insights are recalculated on the next analysis run." confirmLabel="Delete" loading={busy} onConfirm={remove} onCancel={() => setDeleting(null)} />

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import fictional sample data" subtitle="Imported rows are labelled SIMULATED. Use a CSV with the header shown below." size="lg" footer={(
        <><Button variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button><Button loading={busy} onClick={() => runImport({ csv: csvText })} disabled={!csvText.trim()}>Import rows</Button></>
      )}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" icon={Download} onClick={() => setCsvText(SAMPLE_CSV)}>Load sample CSV</Button>
            <label className="btn-secondary cursor-pointer text-xs">Choose CSV file<input type="file" accept=".csv,text/csv" className="sr-only" onChange={onFile} /></label>
          </div>
          <Field label="CSV content" htmlFor="csv-text" hint="Required columns: timestamp, sensorType, metric, value, missionPhase. Optional: exerciseSessionId, notes.">
            <Textarea id="csv-text" rows={8} value={csvText} onChange={(e) => setCsvText(e.target.value)} className="font-mono text-xs" placeholder={SAMPLE_CSV} />
          </Field>
          <p className="text-xs text-slate-500">Imported to: {astronauts.find((a) => a.id === effAst)?.name ?? 'select an astronaut in the table filter or top bar'}.</p>
        </div>
      </Modal>

      <Modal open={simOpen} onClose={() => setSimOpen(false)} title="Simulate a sensor stream" subtitle="Generates demonstration values labelled SIMULATED. Use it to test charts and alerts, not for real assessments." size="md" footer={(
        <><Button variant="ghost" onClick={() => setSimOpen(false)}>Cancel</Button><Button icon={Wand2} loading={busy} onClick={runSimulation}>Generate samples</Button></>
      )}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Sensor type" htmlFor="sim-type"><Select id="sim-type" value={sim.sensorType} onChange={(e) => setSim({ ...sim, sensorType: e.target.value, metric: Object.keys(SENSOR_TYPES[e.target.value].metrics)[0] })}>{Object.keys(SENSOR_TYPES).map((k) => <option key={k} value={k}>{k}</option>)}</Select></Field>
          <Field label="Metric" htmlFor="sim-metric"><Select id="sim-metric" value={sim.metric} onChange={(e) => setSim({ ...sim, metric: e.target.value })}>{Object.entries(SENSOR_TYPES[sim.sensorType].metrics).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}</Select></Field>
          <Field label="Samples (1–500)" htmlFor="sim-n"><Input id="sim-n" type="number" min={1} max={500} value={sim.samples} onChange={(e) => setSim({ ...sim, samples: e.target.value })} /></Field>
          <Field label="Simulated decline across samples (%)" htmlFor="sim-decline" hint="0 = steady. Used only to demonstrate trend detection."><Input id="sim-decline" type="number" min={0} max={50} value={sim.declinePercent} onChange={(e) => setSim({ ...sim, declinePercent: e.target.value })} /></Field>
          <Field label="Mission phase" htmlFor="sim-phase" className="sm:col-span-2"><Select id="sim-phase" value={sim.missionPhase} onChange={(e) => setSim({ ...sim, missionPhase: e.target.value })}>{PHASES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}</Select></Field>
        </div>
      </Modal>
    </div>
  );
}
