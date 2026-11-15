import { Activity, BellRing, Dumbbell, Gauge, RefreshCw, Rocket, Users } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Button from '../components/common/Button.jsx';
import Card from '../components/common/Card.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import KPICard from '../components/dashboard/KPICard.jsx';
import MissionOverview from '../components/dashboard/MissionOverview.jsx';
import RecentInsights from '../components/dashboard/RecentInsights.jsx';
import RecentAlerts from '../components/dashboard/RecentAlerts.jsx';
import MissionTimeline from '../components/dashboard/MissionTimeline.jsx';
import ExerciseAdherenceChart from '../components/dashboard/ExerciseAdherenceChart.jsx';
import PerformanceTrendChart from '../components/dashboard/PerformanceTrendChart.jsx';
import { Skeleton } from '../components/common/LoadingSpinner.jsx';
import { dashboardService } from '../services/dashboardService.js';
import { useFetch } from '../hooks/useFetch.js';
import { useAppContext } from '../context/AppContext.jsx';
import { METRIC_KEYS, PHASES } from '../utils/constants.js';
import { formatDate } from '../utils/formatters.js';
import StatusBadge from '../components/common/StatusBadge.jsx';

export default function Dashboard() {
  const { filterParams, filters, missions, astronauts, notifyDataChanged } = useAppContext();
  const paramsKey = JSON.stringify(filterParams);
  const summary = useFetch(async () => {
    const response = await dashboardService.summary(filterParams);
    return { key: paramsKey, value: response.data };
  }, [paramsKey]);
  const [granularity, setGranularity] = useState('weekly');
  const exercise = useFetch(async () => {
    const response = await dashboardService.exerciseTrends({ ...filterParams, granularity });
    return { key: paramsKey, granularity, value: response.data };
  }, [paramsKey, granularity]);
  const s = summary.data?.key === paramsKey ? summary.data.value : null;
  const exerciseData = exercise.data?.key === paramsKey && exercise.data.granularity === granularity ? exercise.data.value : null;
  const k = s?.kpis;
  const prescribed = exerciseData?.rows.reduce((sum, row) => sum + row.prescribed, 0) ?? 0;
  const completed = exerciseData?.rows.reduce((sum, row) => sum + row.completed, 0) ?? 0;
  const adherence = prescribed ? (completed / prescribed) * 100 : null;
  const scope = getScopeLabel(filterParams, filters, missions, astronauts);
  const allDateScope = getScopeLabel(
    { ...filterParams, startDate: '', endDate: '' },
    { ...filters, missionPhase: 'all' },
    missions,
    astronauts,
  );
  const missionScope = getMissionScope(missions, filters);
  const simulatedMeasurements = Boolean(s?.dataSourceCounts?.simulated);

  const metricCounts = useFetch(async () => {
    const results = await Promise.all(METRIC_KEYS.map(async (key) => ({
      key,
      result: await dashboardService.performanceTrends({ ...filterParams, metric: key }),
    })));
    return { key: paramsKey, results };
  }, [paramsKey]);
  const metricCountResults = metricCounts.data?.key === paramsKey ? metricCounts.data.results : null;
  const metric = metricCountResults?.reduce((best, current) => {
    const records = current.result.data.series.reduce((sum, series) => sum + series.points.length, 0);
    const bestRecords = best.result.data.series.reduce((sum, series) => sum + series.points.length, 0);
    return records > bestRecords ? current : best;
  }, metricCountResults[0])?.key ?? 'forceProduction';

  return (
    <>
      <PageHeader
        title="Astronaut health and performance"
        subtitle="Exercise, performance, mission activity, and changes from each person's baseline."
        breadcrumbs={[{ label: 'Command centre' }]}
        actions={<Button variant="secondary" icon={RefreshCw} loading={(summary.loading || exercise.loading) && !!s} onClick={() => { summary.reload(); exercise.reload(); notifyDataChanged(); }}>Refresh data</Button>}
      />

      <section aria-labelledby="kpi-heading" className="mb-6">
        <h2 id="kpi-heading" className="sr-only">Key performance indicators</h2>
        {summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} /> : !s ? (
          summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} /> :
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <KPICard title="Astronauts in view" value={k.totalAstronauts.value} icon={Users} tone="info" description="Astronaut records in the current filter" scope={allDateScope} simulated={simulatedMeasurements} />
            <KPICard title="Missions in progress" value={k.activeMissions.value} icon={Rocket} tone="violet" description="Missions with active status" scope={missionScope} simulated={simulatedMeasurements} />
            <KPICard
              title="Sessions completed"
              value={exercise.error ? undefined : prescribed ? `${completed} of ${prescribed} completed` : undefined}
              icon={Dumbbell} tone="ok"
              state={exercise.error ? 'error' : exercise.loading && !exerciseData ? 'loading' : prescribed ? 'value' : 'empty'}
              hint={exercise.error ? exercise.error : 'No sessions prescribed in this period.'}
              onRetry={exercise.reload}
              description={exercise.loading && !exerciseData ? 'Loading prescribed session totals.' : prescribed ? `${completed} of ${prescribed} prescribed this period` : 'No prescribed sessions this period.'}
              scope={scope}
              simulated={simulatedMeasurements}
              message="No sessions prescribed in this period."
            />
            <KPICard
              title="Adherence" value={adherence} unit="%"
              icon={Gauge} tone={adherence !== null && adherence < 80 ? 'attention' : 'ok'}
              state={exercise.error ? 'error' : exercise.loading && !exerciseData ? 'loading' : prescribed ? 'value' : 'empty'}
              hint={exercise.error ? exercise.error : 'No sessions prescribed in this period.'}
              onRetry={exercise.reload}
              description="Completed ÷ prescribed sessions"
              scope={scope}
              simulated={simulatedMeasurements}
              message="No sessions prescribed in this period."
            />
            <KPICard title="Changes past threshold" value={k.performanceChangesDetected.value} icon={Activity} tone={k.performanceChangesDetected.value ? 'attention' : 'info'} description="Compared with each person's own baseline" scope={allDateScope} simulated={simulatedMeasurements} />
            <KPICard title="Alerts to review" value={k.alertsRequiringReview.value === 0 ? 'All alerts reviewed' : k.alertsRequiringReview.value} icon={BellRing} tone={k.alertsRequiringReview.value ? 'critical' : 'ok'} valueTone={k.alertsRequiringReview.value ? undefined : 'ok'} description="New alerts waiting for a specialist" scope={allDateScope} />
          </div>
        )}
      </section>

      <div className="grid min-w-0 gap-6 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2" title="Crew overview" subtitle="Select a row to open the astronaut profile." scope={allDateScope} bodyClass="dashboard-card">
          {summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} /> : !s ? <Skeleton className="h-48" /> : <MissionOverview rows={s.overview} loading={summary.loading} />}
        </Card>
        <Card title="Recent alerts" subtitle="Newest alerts first." scope={allDateScope} bodyClass="dashboard-card">
          {summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} /> : !s ? <Skeleton className="h-48" /> : <RecentAlerts alerts={s.recentAlerts} astronauts={astronauts} />}
        </Card>
      </div>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
        <Card title="Exercise adherence" subtitle="Prescribed, completed, and missed sessions." scope={scope} bodyClass="dashboard-card">
          <ExerciseAdherenceChart
            data={exerciseData}
            loading={exercise.loading || !exerciseData}
            error={exercise.error}
            reload={exercise.reload}
            granularity={granularity}
            onGranularityChange={setGranularity}
            simulated={simulatedMeasurements}
          />
        </Card>
        <Card title="Muscle performance trends" subtitle="Each astronaut is compared with their own baseline." scope={scope} bodyClass="dashboard-card">
          <PerformanceTrendChart
            params={filterParams}
            paramsKey={paramsKey}
            defaultMetric={metric}
            simulated={simulatedMeasurements}
            defaultMetricError={metricCounts.error}
            onRetryDefaultMetric={metricCounts.reload}
          />
        </Card>
      </div>

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2" title="Mission activity timeline" subtitle="Exercise, assessment, and sensor records by phase." scope={scope} bodyClass="dashboard-card">
          {summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} /> : !s ? <Skeleton className="h-40" /> : (
            <>
              {simulatedMeasurements && <StatusBadge tone="violet" className="mb-3">Simulated</StatusBadge>}
              <MissionTimeline timeline={s.missionTimeline} />
            </>
          )}
        </Card>
        <Card title="Latest insights" subtitle="Measurement differences from each astronaut's baseline." scope={allDateScope} bodyClass="dashboard-card">
          {summary.error ? <ErrorState message={summary.error} onRetry={summary.reload} /> : !s ? <Skeleton className="h-48" /> : <RecentInsights insights={s.latestInsights} astronauts={astronauts} simulated={simulatedMeasurements} />}
        </Card>
      </div>

      {s && (
        <p className="mt-6 text-center text-xs text-muted">
          Data sources in this view: {Object.entries(s.dataSourceCounts).map(([source, count]) => `${source === 'ai-generated' ? 'rule-based' : source} ${count}`).join(' · ') || 'none'}. Simulated demonstration values are not hardware measurements.
        </p>
      )}
    </>
  );
}

function getScopeLabel(params, filters, missions, astronauts) {
  const start = params.startDate ? formatDate(params.startDate) : null;
  const end = params.endDate ? formatDate(params.endDate) : null;
  const dateScope = start && end ? `${start} to ${end}` : start ? `From ${start}` : end ? `Through ${end}` : 'All recorded dates';
  const mission = missions.find((item) => item.id === filters.missionId)?.name ?? (filters.missionId === 'all' ? 'All missions' : 'Selected mission');
  const astronaut = astronauts.find((item) => item.id === filters.astronautId)?.name ?? (filters.astronautId === 'all' ? null : 'Selected astronaut');
  const phase = filters.missionPhase === 'all' ? null : PHASES.find((item) => item.value === filters.missionPhase)?.label ?? filters.missionPhase;
  return [dateScope, mission, phase, astronaut].filter(Boolean).join(' · ');
}

function getMissionScope(missions, filters) {
  const mission = missions.find((item) => item.id === filters.missionId)?.name ?? (filters.missionId === 'all' ? 'All missions' : 'Selected mission');
  return `All recorded dates · ${mission}`;
}
