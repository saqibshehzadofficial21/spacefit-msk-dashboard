import { useState } from 'react';
import { dashboardService } from '../../services/dashboardService.js';
import { useFetch } from '../../hooks/useFetch.js';
import TrendChart from '../charts/TrendChart.jsx';
import { COLORS } from '../charts/chartTheme.js';
import { METRICS, METRIC_KEYS } from '../../utils/constants.js';
import { formatDate, isoDay } from '../../utils/formatters.js';
import { Select as SelectInput } from '../common/Input.jsx';
import { Skeleton } from '../common/LoadingSpinner.jsx';
import ErrorState from '../common/ErrorState.jsx';

/**
 * Shows each astronaut's change from THEIR OWN baseline (percent). Lines for different astronauts are never
 * plotted on a shared absolute scale, so comparisons stay individual.
 */
export default function PerformanceTrendChart({ params, paramsKey }) {
  const [metric, setMetric] = useState('forceProduction');
  const { data, loading, error, reload } = useFetch(() => dashboardService.performanceTrends({ ...params, metric }), [paramsKey, metric]);
  const def = METRICS[metric];

  const series = (data?.series ?? []).filter((s) => s.baseline && s.points.length);
  const byDate = new Map();
  series.forEach((s) => {
    s.points.forEach((p) => {
      const x = isoDay(p.date);
      const row = byDate.get(x) ?? { x };
      if (def.kind === 'percent' && s.baseline.value) row[s.astronautId] = Number((((p.value - s.baseline.value) / s.baseline.value) * 100).toFixed(2));
      if (def.kind === 'points') row[s.astronautId] = Number((p.value - s.baseline.value).toFixed(2));
      byDate.set(x, row);
    });
  });
  const rows = [...byDate.values()].sort((a, b) => a.x.localeCompare(b.x));
  const chartSeries = series.map((s, i) => ({ key: s.astronautId, label: s.astronautName, color: COLORS.series[i % COLORS.series.length] }));
  const unitLabel = def.kind === 'percent' ? '%' : 'pts';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">Change from each astronaut's own baseline ({unitLabel})</p>
        <SelectInput aria-label="Metric for trend" value={metric} onChange={(e) => setMetric(e.target.value)} className="h-8 w-auto py-1 text-xs">
          {METRIC_KEYS.map((k) => <option key={k} value={k}>{METRICS[k].label}</option>)}
        </SelectInput>
      </div>
      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <Skeleton className="h-[280px]" /> : (
        <TrendChart
          data={rows}
          series={chartSeries}
          height={280}
          unit={unitLabel}
          label={`${def.label} change from individual baseline`}
          emptyText="No assessment has both a baseline and a measurement for this metric in the current filter."
          references={def.kind === 'percent' ? [{ y: -10, label: 'sample −10%', color: COLORS.warn }] : []}
          xFormatter={(v) => formatDate(v)}
        />
      )}
    </div>
  );
}
