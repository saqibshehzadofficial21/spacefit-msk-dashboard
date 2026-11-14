import { Activity, BellRing, Dumbbell, Gauge, RefreshCw, Rocket, Users } from 'lucide-react';
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

export default function Dashboard() {
  const { filterParams, notifyDataChanged } = useAppContext();
  const paramsKey = JSON.stringify(filterParams);
  const summary = useFetch(() => dashboardService.summary(filterParams), [paramsKey]);
  const s = summary.data;
  const k = s?.kpis;

  return (
    <>
      <PageHeader
        title="Astronaut Health & Performance Overview"
        subtitle="Monitor exercise countermeasures, physical performance, mission activity, and individual baseline changes."
        breadcrumbs={[{ label: 'Command centre' }]}
        actions={<Button variant="secondary" icon={RefreshCw} loading={summary.loading && !!s} onClick={() => { summary.reload(); notifyDataChanged(); }}>Refresh data</Button>}
      />

      {summary.error && <div className="mb-6"><ErrorState message={summary.error} onRetry={summary.reload} /></div>}

      <section aria-labelledby="kpi-heading" className="mb-6">
        <h2 id="kpi-heading" className="sr-only">Key performance indicators</h2>
        {!s ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-36" />)}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <KPICard title="Total astronauts" value={k.totalAstronauts.value} icon={Users} tone="cyan" description={k.totalAstronauts.description} />
            <KPICard title="Active missions" value={k.activeMissions.value} icon={Rocket} tone="violet" description={k.activeMissions.description} />
            <KPICard title="Exercise sessions completed" value={k.exerciseSessionsCompleted.value} icon={Dumbbell} tone="ok" description={k.exerciseSessionsCompleted.description} />
            <KPICard title="Average exercise adherence" value={k.averageAdherence.value} unit="%" icon={Gauge} tone={k.averageAdherence.value !== null && k.averageAdherence.value < 80 ? 'attention' : 'ok'} description={k.averageAdherence.description} />
            <KPICard title="Performance changes detected" value={k.performanceChangesDetected.value} icon={Activity} tone={k.performanceChangesDetected.value ? 'attention' : 'cyan'} description={k.performanceChangesDetected.description} />
            <KPICard title="Alerts requiring review" value={k.alertsRequiringReview.value} icon={BellRing} tone={k.alertsRequiringReview.value ? 'critical' : 'cyan'} description={k.alertsRequiringReview.description} />
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="A. Astronaut mission overview" subtitle="Click a row to open the astronaut profile.">
          {!s ? <Skeleton className="h-48" /> : <MissionOverview rows={s.overview} loading={summary.loading} />}
        </Card>
        <Card title="E. Recent alerts" subtitle="Newest first. Open an alert to review it.">
          {!s ? <Skeleton className="h-48" /> : <RecentAlerts alerts={s.recentAlerts} />}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="B. Exercise adherence" subtitle="Prescribed, completed and missed sessions. Daily, weekly or monthly grouping; the top-bar date range applies.">
          <ExerciseAdherenceChart params={filterParams} paramsKey={paramsKey} />
        </Card>
        <Card title="C. Muscle performance trends" subtitle="Change from each astronaut's own baseline. Lines are never combined across baselines.">
          <PerformanceTrendChart params={filterParams} paramsKey={paramsKey} />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="F. Mission activity timeline" subtitle="Records by phase: preflight, in-flight and postflight.">
          {!s ? <Skeleton className="h-40" /> : <MissionTimeline timeline={s.missionTimeline} />}
        </Card>
        <Card title="D. Latest insights" subtitle="Rule-based, compared with each astronaut's baseline.">
          {!s ? <Skeleton className="h-48" /> : <RecentInsights insights={s.latestInsights} />}
        </Card>
      </div>

      {s && (
        <p className="mt-6 text-center text-xs text-slate-500">
          Data sources in this view: {Object.entries(s.dataSourceCounts).map(([k2, v]) => `${k2} ${v}`).join(' · ') || 'none'}. Simulated values are labelled and are not hardware measurements.
        </p>
      )}
    </>
  );
}
