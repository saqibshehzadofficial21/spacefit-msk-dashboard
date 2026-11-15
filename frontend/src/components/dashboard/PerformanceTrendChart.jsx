import { useState } from 'react';
import { dashboardService } from '../../services/dashboardService.js';
import { useFetch } from '../../hooks/useFetch.js';
import TrendChart from '../charts/TrendChart.jsx';
import { COLORS } from '../charts/chartTheme.js';
import { METRICS, METRIC_KEYS } from '../../utils/constants.js';
import { formatDate, formatNumber, isoDay } from '../../utils/formatters.js';
import { Select as SelectInput } from '../common/Input.jsx';
import { Skeleton } from '../common/LoadingSpinner.jsx';
import ErrorState from '../common/ErrorState.jsx';

export default function PerformanceTrendChart({ params, paramsKey, defaultMetric = 'forceProduction', simulated, defaultMetricError, onRetryDefaultMetric }) {
  const [selectedMetric, setSelectedMetric] = useState(null);
  const metric = selectedMetric ?? defaultMetric;
  const request = useFetch(async () => {
    const response = await dashboardService.performanceTrends({ ...params, metric });
    return { paramsKey, metric, value: response.data };
  }, [paramsKey, metric]);
  const { loading, error, reload } = request;
  const data = request.data?.paramsKey === paramsKey && request.data.metric === metric ? request.data.value : null;
  const def = METRICS[metric];
  const sourceSeries = [...(data?.series ?? [])].sort((a, b) => a.astronautId.localeCompare(b.astronautId));
  const pointsByDate = new Map();
  const chartSeries = [];
  const singleRecords = [];
  const unavailable = [];

  sourceSeries.forEach((person) => {
    if (!person.baseline) {
      unavailable.push({ id: person.astronautId, name: person.astronautName, reason: 'No baseline for this metric.' });
      return;
    }
    if (def.kind === 'percent' && person.baseline.value === 0) {
      unavailable.push({ id: person.astronautId, name: person.astronautName, reason: 'Not available. The baseline is zero.' });
      return;
    }

    const key = person.astronautId;
    const personPoints = [...person.points].sort((a, b) => a.date.localeCompare(b.date));
    const colorIndex = stableColorIndex(key);
    if (personPoints.length < 2 && personPoints.length === 1) {
      singleRecords.push({ ...person, point: personPoints[0] });
    }
    personPoints.forEach((point) => {
      const x = isoDay(point.date);
      const row = pointsByDate.get(x) ?? { x };
      row[key] = cleanOneDecimal(def.kind === 'percent'
        ? (((point.value - person.baseline.value) / person.baseline.value) * 100)
        : (point.value - person.baseline.value));
      row[`${key}__measurement`] = point.value;
      pointsByDate.set(x, row);
    });
    if (personPoints.length >= 2) {
      chartSeries.push({ key, label: person.astronautName, color: COLORS.series[colorIndex] });
    }
  });

  const rows = [...pointsByDate.values()].sort((a, b) => a.x.localeCompare(b.x));
  const usableRows = rows.filter((row) => chartSeries.some((series) => typeof row[series.key] === 'number'));
  const changeUnit = def.kind === 'percent' ? '%' : def.unit;
  const singlePointText = singleRecords.map(({ astronautName, point, baseline }) => {
    const change = def.kind === 'percent'
      ? ((point.value - baseline.value) / baseline.value) * 100
      : point.value - baseline.value;
    return `${astronautName}: ${formatNumber(point.value, 1)} ${def.unit} (${change > 0 ? '+' : ''}${formatNumber(change, 1)} ${changeUnit} from baseline)`;
  });

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-secondary">Change from own baseline ({changeUnit})</p>
          {simulated && <span className="simulated-badge rounded-full border px-2 py-0.5 text-xs font-semibold" title="Simulated demonstration values, not hardware measurements.">Simulated</span>}
        </div>
        <label className="flex items-center gap-2 text-xs text-secondary">
          Metric
          <SelectInput aria-label="Metric for trend" value={metric} onChange={(e) => setSelectedMetric(e.target.value)} className="h-9 w-auto py-1 text-xs">
            {METRIC_KEYS.map((key) => <option key={key} value={key}>{METRICS[key].label}</option>)}
          </SelectInput>
        </label>
      </div>
      {defaultMetricError && <p className="text-xs text-status-critical" role="status">Could not compare metric coverage to select a default. <button type="button" className="font-semibold underline" onClick={onRetryDefaultMetric}>Retry</button></p>}
      {error ? <ErrorState message={error} onRetry={reload} /> : !data ? <Skeleton className="h-[240px]" /> : (
        <>
          {singlePointText.length > 0 && (
            <div className="rounded-lg bg-surface-sunken p-3 text-xs text-secondary">
              <p className="font-medium">Need at least 2 records to show a trend.</p>
              <ul className="mt-1 flex flex-col gap-1">{singlePointText.map((text) => <li key={text}>{text}</li>)}</ul>
            </div>
          )}
          {unavailable.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs text-muted">
              {unavailable.map((item) => <li key={item.id}>{item.name}: {item.reason}</li>)}
            </ul>
          )}
          <TrendChart
            data={usableRows}
            series={chartSeries}
            unit={changeUnit}
            label={`${def.label} change from each astronaut's own baseline`}
            emptyText={data?.series?.length ? 'Need at least 2 records to show a trend.' : 'No records for this filter.'}
            references={[{ y: 0, label: 'Own baseline', color: COLORS.axis }]}
            xFormatter={formatDate}
            tooltipFormatter={(value, _name, entry) => {
              const measurement = entry?.payload?.[`${entry.dataKey}__measurement`];
              const change = formatNumber(value, 1);
              const signedChange = Number(value) > 0 ? `+${change}` : change;
              return `${signedChange} ${changeUnit} from baseline · ${formatNumber(measurement, 1)} ${def.unit}`;
            }}
          />
        </>
      )}
    </div>
  );
}

function stableColorIndex(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) | 0;
  return ((hash % COLORS.series.length) + COLORS.series.length) % COLORS.series.length;
}

function cleanOneDecimal(value) {
  const rounded = Number(value.toFixed(1));
  return Object.is(rounded, -0) ? 0 : rounded;
}
