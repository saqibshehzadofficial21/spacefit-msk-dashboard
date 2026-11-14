import { useState } from 'react';
import { dashboardService } from '../../services/dashboardService.js';
import { useFetch } from '../../hooks/useFetch.js';
import AdherenceChart from '../charts/AdherenceChart.jsx';
import { Select as SelectInput } from '../common/Input.jsx';
import { Skeleton } from '../common/LoadingSpinner.jsx';
import ErrorState from '../common/ErrorState.jsx';

export default function ExerciseAdherenceChart({ params, paramsKey }) {
  const [granularity, setGranularity] = useState('weekly');
  const { data, loading, error, reload } = useFetch(() => dashboardService.exerciseTrends({ ...params, granularity }), [paramsKey, granularity]);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-400">Prescribed, completed and missed sessions · adherence = completed ÷ prescribed</p>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Grouping
          <SelectInput aria-label="Group adherence by" value={granularity} onChange={(e) => setGranularity(e.target.value)} className="h-8 w-auto py-1 text-xs">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </SelectInput>
        </label>
      </div>
      {error ? <ErrorState message={error} onRetry={reload} /> : loading && !data ? <Skeleton className="h-[300px]" /> : <AdherenceChart rows={data?.rows ?? []} />}
    </div>
  );
}
