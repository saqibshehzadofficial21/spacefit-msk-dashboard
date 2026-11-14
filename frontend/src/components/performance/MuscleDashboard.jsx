import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { baselineService, performanceService } from '../../services/assessmentService.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAppContext } from '../../context/AppContext.jsx';
import Button from '../common/Button.jsx';
import Card from '../common/Card.jsx';
import EmptyState from '../common/EmptyState.jsx';
import ErrorState from '../common/ErrorState.jsx';
import Modal from '../common/Modal.jsx';
import { Skeleton } from '../common/LoadingSpinner.jsx';
import TrendChart from '../charts/TrendChart.jsx';
import BarCompare from '../charts/BarCompare.jsx';
import { COLORS } from '../charts/chartTheme.js';
import PerformanceMetricCard from './PerformanceMetricCard.jsx';
import PerformanceComparison from './PerformanceComparison.jsx';
import PerformanceHistory from './PerformanceHistory.jsx';
import AssessmentForm from './AssessmentForm.jsx';
import { METRICS, METRIC_KEYS, PHASES } from '../../utils/constants.js';
import { isoDay, formatDate } from '../../utils/formatters.js';
import { isNum, mean, percentChange, trend, difference } from '../../utils/calculations.js';

const CHARTS = [
  { key: 'forceProduction', title: 'Force production over time', subtitle: 'Instrumented force sensor · dashed line = individual baseline' },
  { key: 'jointROM', title: 'Joint ROM history', subtitle: 'IMU-derived joint movement estimate' },
  { key: 'movementVelocity', title: 'Movement velocity trends', subtitle: 'IMU-derived movement data' },
  { key: 'movementConsistency', title: 'Movement consistency', subtitle: 'Repeated movement comparison (%)' },
  { key: 'functionalScore', title: 'Functional assessment history', subtitle: 'Standardised assessment task (protocol-defined points)' },
];

/**
 * Muscle performance dashboard for ONE astronaut. Every number is compared with that astronaut's own baseline.
 * Measurement sources are stated on each card; the module never claims to measure muscle mass.
 */
export default function MuscleDashboard({ astronautId }) {
  const { can, filterParams, notifyDataChanged } = useAppContext();
  const [historyMetric, setHistoryMetric] = useState(null);
  const [formState, setFormState] = useState({ open: false, record: null });
  const [phasesOn, setPhasesOn] = useState({ preflight: true, 'in-flight': true, postflight: true });

  const measurements = useFetch(() => performanceService.history(astronautId), [astronautId]);
  const baselines = useFetch(() => baselineService.history(astronautId), [astronautId]);

  const records = useMemo(() => (measurements.data ?? []).filter((r) => {
    const t = new Date(r.assessmentDate).getTime();
    if (filterParams.startDate && t < new Date(filterParams.startDate).getTime()) return false;
    if (filterParams.endDate && t > new Date(`${filterParams.endDate}T23:59:59Z`).getTime()) return false;
    return true;
  }), [measurements.data, filterParams.startDate, filterParams.endDate]);

  const baselineRecords = baselines.data ?? [];

  // Per-metric summary, computed only from stored records for this astronaut.
  const summary = useMemo(() => {
    const out = {};
    METRIC_KEYS.forEach((k) => {
      const series = records.filter((r) => isNum(r[k])).sort((a, b) => new Date(a.assessmentDate) - new Date(b.assessmentDate));
      const latest = series[series.length - 1] ?? null;
      const base = baselineRecords.filter((b) => isNum(b[k])).sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate))[0] ?? null;
      const baseValue = base ? base[k] : null;
      out[k] = {
        series,
        count: series.length,
        latest: latest ? latest[k] : null,
        latestDate: latest?.assessmentDate ?? null,
        latestSource: latest?.dataSource ?? null,
        baseline: baseValue,
        difference: latest && baseValue !== null ? difference(latest[k], baseValue) : null,
        percent: latest && baseValue !== null && METRICS[k].kind === 'percent' ? percentChange(latest[k], baseValue) : null,
        trend: trend(series.map((s) => s[k])),
      };
    });
    return out;
  }, [records, baselineRecords]);

  const latestBaseline = baselineRecords[0] ?? null;
  const latestMeasurement = records.length ? records[records.length - 1] : null;

  // Phase comparison: mean % change from the individual baseline, per phase. Percent metrics only (comparable units).
  const phaseData = METRIC_KEYS.filter((k) => METRICS[k].kind === 'percent').map((k) => {
    const row = { x: METRICS[k].label };
    PHASES.forEach((p) => {
      const vals = records.filter((r) => r.missionPhase === p.value && isNum(r[k]) && summary[k].baseline).map((r) => percentChange(r[k], summary[k].baseline));
      row[p.value] = vals.length ? Number(mean(vals).toFixed(1)) : null;
    });
    return row;
  });
  const phaseBars = PHASES.filter((p) => phasesOn[p.value]).map((p, i) => ({ key: p.value, label: p.label, color: [COLORS.blue, COLORS.cyan, COLORS.violet][i] }));

  if (measurements.error) return <ErrorState message={measurements.error} onRetry={measurements.reload} />;
  if (measurements.loading && !measurements.data) return <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-64" /><Skeleton className="h-64" /><Skeleton className="h-64" /></div>;

  if (!measurements.data?.length) {
    return (
      <EmptyState
        title="No performance assessments for this astronaut"
        description="Record a baseline first, then add performance assessments. Charts and comparisons are calculated only from stored records."
        action={can('performance:write') ? <Button icon={Plus} onClick={() => setFormState({ open: true, record: null })}>Add performance assessment</Button> : null}
      />
    );
  }

  const historyDef = historyMetric ? METRICS[historyMetric] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400">{records.length} assessment(s) in the selected date range · compared with this astronaut's own baseline only</p>
        {can('performance:write') && <Button icon={Plus} onClick={() => setFormState({ open: true, record: null })}>Add performance assessment</Button>}
      </div>

      <section aria-labelledby="metric-cards-heading" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <h2 id="metric-cards-heading" className="sr-only">Performance metric cards</h2>
        {METRIC_KEYS.map((k) => (
          <PerformanceMetricCard key={k} def={METRICS[k]} info={summary[k]} onViewHistory={() => setHistoryMetric(k)} />
        ))}
      </section>

      <section aria-labelledby="charts-heading" className="grid gap-5 xl:grid-cols-2">
        <h2 id="charts-heading" className="sr-only">Performance charts</h2>
        {CHARTS.map((c) => {
          const def = METRICS[c.key];
          const data = summary[c.key].series.map((r) => ({ x: isoDay(r.assessmentDate), value: r[c.key] }));
          return (
            <Card key={c.key} title={c.title} subtitle={c.subtitle} className={c.key === 'forceProduction' ? 'xl:col-span-2' : ''}>
              <TrendChart
                data={data}
                series={[{ key: 'value', label: def.label, color: COLORS.cyan }]}
                unit={def.unit}
                label={`${c.title} for ${astronautId}`}
                height={240}
                references={summary[c.key].baseline !== null ? [{ y: summary[c.key].baseline, label: 'baseline', color: COLORS.warn }] : []}
                xFormatter={(v) => formatDate(v)}
                emptyText={`No ${def.label.toLowerCase()} measurements in this range.`}
              />
            </Card>
          );
        })}
      </section>

      <section aria-labelledby="compare-heading" className="grid gap-5 xl:grid-cols-2">
        <h2 id="compare-heading" className="sr-only">Comparisons</h2>
        <Card title="Baseline versus current" subtitle={latestBaseline && latestMeasurement ? `Latest baseline ${formatDate(latestBaseline.assessmentDate)} vs latest measurement ${formatDate(latestMeasurement.assessmentDate)}` : 'Needs a baseline and a measurement'}>
          <PerformanceComparison baseline={latestBaseline} current={latestMeasurement} />
        </Card>
        <Card
          title="Mission phase comparison"
          subtitle="Mean % change from the individual baseline, by mission phase (percentage metrics)"
          actions={(
            <div className="flex flex-wrap gap-2" role="group" aria-label="Phases to compare">
              {PHASES.map((p) => (
                <label key={p.value} className={`chip cursor-pointer select-none ${phasesOn[p.value] ? 'border-cyan-400/50 bg-accent/15 text-cyan-100' : 'border-slate-600 text-slate-400'}`}>
                  <input type="checkbox" className="sr-only" checked={phasesOn[p.value]} onChange={(e) => setPhasesOn((s) => ({ ...s, [p.value]: e.target.checked }))} />
                  {p.label}
                </label>
              ))}
            </div>
          )}
        >
          <BarCompare data={phaseData} bars={phaseBars} signed={false} unit="%" height={280} label="Mission phase comparison chart" />
        </Card>
        <Card title="Baseline vs current change (%)" subtitle="Latest measurement against the latest baseline, percentage metrics">
          <BarCompare
            data={METRIC_KEYS.filter((k) => METRICS[k].kind === 'percent').map((k) => ({ x: METRICS[k].label, change: summary[k].percent }))}
            bars={[{ key: 'change', label: '% change', color: COLORS.blue }]}
            signed
            unit="%"
            height={260}
            label="Baseline versus current percentage change"
          />
        </Card>
        <Card title="All assessment records" subtitle="Stored measurements, newest first. Blank cells are unmeasured metrics.">
          <PerformanceHistory
            records={[...records].reverse().slice(0, 50)}
            canEdit={can('performance:write')}
            onEdit={(r) => setFormState({ open: true, record: r })}
          />
        </Card>
      </section>

      <Modal open={!!historyMetric} onClose={() => setHistoryMetric(null)} title={historyDef ? `${historyDef.label} history` : ''} subtitle={historyDef ? `${historyDef.measurement} · ${historyDef.unit}` : ''} size="lg">
        {historyMetric && (
          <div className="flex flex-col gap-4">
            <TrendChart
              data={summary[historyMetric].series.map((r) => ({ x: isoDay(r.assessmentDate), value: r[historyMetric] }))}
              series={[{ key: 'value', label: historyDef.label, color: COLORS.cyan }]}
              unit={historyDef.unit}
              height={260}
              label={`${historyDef.label} history`}
              references={summary[historyMetric].baseline !== null ? [{ y: summary[historyMetric].baseline, label: 'baseline', color: COLORS.warn }] : []}
              xFormatter={(v) => formatDate(v)}
            />
            <table className="min-w-full text-sm">
              <caption className="sr-only">Values for {historyDef.label}</caption>
              <thead><tr><th scope="col" className="table-th">Date</th><th scope="col" className="table-th text-right">Value ({historyDef.unit})</th><th scope="col" className="table-th">Source</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {[...summary[historyMetric].series].reverse().map((r) => (
                  <tr key={r.id}><td className="table-td">{formatDate(r.assessmentDate)}</td><td className="table-td text-right tabular-nums">{r[historyMetric]}</td><td className="table-td text-xs text-slate-400">{r.dataSource}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <AssessmentForm
        open={formState.open}
        mode="performance"
        record={formState.record}
        astronautId={astronautId}
        onClose={() => setFormState({ open: false, record: null })}
        onSaved={() => { setFormState({ open: false, record: null }); measurements.reload(); notifyDataChanged(); }}
      />
    </div>
  );
}


