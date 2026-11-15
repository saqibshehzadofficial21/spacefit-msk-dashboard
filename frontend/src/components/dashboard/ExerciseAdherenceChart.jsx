import AdherenceChart from '../charts/AdherenceChart.jsx';
import { Select as SelectInput } from '../common/Input.jsx';
import { Skeleton } from '../common/LoadingSpinner.jsx';
import ErrorState from '../common/ErrorState.jsx';

export default function ExerciseAdherenceChart({ data, loading, error, reload, granularity, onGranularityChange, simulated }) {
  const rows = data?.rows ?? [];
  const prescribed = rows.reduce((sum, row) => sum + row.prescribed, 0);
  const completed = rows.reduce((sum, row) => sum + row.completed, 0);
  const summary = prescribed ? `${((completed / prescribed) * 100).toFixed(1)}% completed across ${prescribed} prescribed sessions.` : 'No sessions prescribed in this period.';
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-secondary">Prescribed, completed, and missed sessions · adherence = completed ÷ prescribed.</p>
          {simulated && <span className="simulated-badge rounded-full border px-2 py-0.5 text-xs font-semibold" title="Simulated demonstration values, not hardware measurements.">Simulated</span>}
        </div>
        <label className="flex items-center gap-2 text-xs text-secondary">
          Grouping
          <SelectInput aria-label="Group adherence by" value={granularity} onChange={(e) => onGranularityChange(e.target.value)} className="h-9 w-auto py-1 text-xs">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </SelectInput>
        </label>
      </div>
      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <Skeleton className="h-[240px]" /> : (
        <>
          <AdherenceChart rows={rows} />
          <p className="text-sm font-medium text-secondary">{summary}</p>
        </>
      )}
    </div>
  );
}
