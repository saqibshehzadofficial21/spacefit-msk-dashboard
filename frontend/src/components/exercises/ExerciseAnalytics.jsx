import { useMemo, useState } from 'react';
import { exerciseService } from '../../services/exerciseService.js';
import { dashboardService } from '../../services/dashboardService.js';
import { useFetch } from '../../hooks/useFetch.js';
import { useAppContext } from '../../context/AppContext.jsx';
import Card from '../common/Card.jsx';
import AdherenceChart from '../charts/AdherenceChart.jsx';
import AreaTrend from '../charts/AreaTrend.jsx';
import TrendChart from '../charts/TrendChart.jsx';
import { COLORS } from '../charts/chartTheme.js';
import { Select } from '../common/Input.jsx';
import { Skeleton } from '../common/LoadingSpinner.jsx';
import ErrorState from '../common/ErrorState.jsx';
import { isoDay, formatDate } from '../../utils/formatters.js';

/** Interactive exercise analytics: adherence, duration, workload/speed and resistance history. */
export default function ExerciseAnalytics({ astronautId = 'all', category = 'all' }) {
  const { filterParams, astronauts } = useAppContext();
  const [granularity, setGranularity] = useState('weekly');
  const scope = { ...filterParams, astronautId: astronautId !== 'all' ? astronautId : filterParams.astronautId, category: category === 'all' ? undefined : category };
  const scopeKey = JSON.stringify({ ...scope, granularity });
  const trends = useFetch(() => dashboardService.exerciseTrends({ ...scope, granularity }), [scopeKey]);
  const resistance = useFetch(() => exerciseService.list({
    astronautId: scope.astronautId, category: 'resistance-training', missionPhase: filterParams.missionPhase,
    startDate: filterParams.startDate, endDate: filterParams.endDate, pageSize: 200, sortBy: 'sessionDate', order: 'asc',
  }), [scopeKey]);

  const rows = trends.data?.rows ?? [];
  const resistanceRows = useMemo(() => {
    const byDay = new Map();
    (resistance.data ?? []).filter((r) => r.completionStatus === 'completed' && r.resistanceKg != null).forEach((r) => {
      const x = isoDay(r.sessionDate);
      const row = byDay.get(x) ?? { x };
      const k = r.equipment === 'ROCKY' ? 'ROCKY' : 'ARED';
      row[k] = r.resistanceKg;
      byDay.set(x, row);
    });
    return [...byDay.values()].sort((a, b) => a.x.localeCompare(b.x));
  }, [resistance.data]);

  const showWorkload = category === 'all' || category === 'cycle-ergometer';
  const showSpeed = category === 'all' || category === 'treadmill';
  const showResistance = category === 'all' || category === 'resistance-training';

  if (trends.error) return <ErrorState message={trends.error} onRetry={trends.reload} />;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card
        title="Adherence over time"
        subtitle="Prescribed versus completed sessions"
        className="xl:col-span-2"
        actions={(
          <label className="flex items-center gap-2 text-xs text-slate-400">
            Grouping
            <Select aria-label="Adherence grouping" value={granularity} onChange={(e) => setGranularity(e.target.value)} className="h-8 w-auto py-1 text-xs">
              <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </Select>
          </label>
        )}
      >
        {trends.loading && !trends.data ? <Skeleton className="h-[300px]" /> : <AdherenceChart rows={rows} height={300} />}
      </Card>

      <Card title="Exercise duration trend" subtitle="Total minutes per period">
        {trends.loading && !trends.data ? <Skeleton /> : <AreaTrend data={rows.map((r) => ({ x: r.period, minutes: r.totalDurationMinutes }))} dataKey="minutes" name="Duration" unit="min" label="Exercise duration trend" />}
      </Card>

      {showResistance && (
        <Card title="Resistance training history" subtitle="Resistance setting per completed session (ARED and ROCKY kept separate)">
          {resistance.loading && !resistance.data ? <Skeleton /> : (
            <TrendChart data={resistanceRows} series={[{ key: 'ARED', label: 'ARED (kg)', color: COLORS.cyan }, { key: 'ROCKY', label: 'ROCKY (kg)', color: COLORS.violet }]} unit="kg" label="Resistance history by equipment" height={260} xFormatter={(v) => formatDate(v)} emptyText="No completed resistance sessions in this scope." />
          )}
        </Card>
      )}

      {showWorkload && (
        <Card title="Cycle workload trend" subtitle="Mean workload per period (CEVIS records)">
          <TrendChart data={rows.map((r) => ({ x: r.period, workload: r.meanWorkloadW }))} series={[{ key: 'workload', label: 'Mean workload', color: COLORS.blue }]} unit="W" label="Cycle workload trend" height={260} emptyText="No cycle workload records in this scope." xFormatter={(v) => formatDate(v)} />
        </Card>
      )}

      {showSpeed && (
        <Card title="Treadmill speed trend" subtitle="Mean speed per period">
          <TrendChart data={rows.map((r) => ({ x: r.period, speed: r.meanSpeedKph }))} series={[{ key: 'speed', label: 'Mean speed', color: COLORS.cyan }]} unit="km/h" label="Treadmill speed trend" height={260} emptyText="No treadmill speed records in this scope." xFormatter={(v) => formatDate(v)} />
        </Card>
      )}
      {astronauts.length === 0 && <p className="text-sm text-slate-400">Add an astronaut to see analytics.</p>}
    </div>
  );
}
