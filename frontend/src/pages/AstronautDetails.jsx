import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileBarChart } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import Button from '../components/common/Button.jsx';
import { Skeleton } from '../components/common/LoadingSpinner.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import AstronautProfile from '../components/astronauts/AstronautProfile.jsx';
import AssessmentPanel from '../components/performance/AssessmentPanel.jsx';
import ExerciseHistory from '../components/exercises/ExerciseHistory.jsx';
import MuscleDashboard from '../components/performance/MuscleDashboard.jsx';
import SensorPanel from '../components/sensors/SensorPanel.jsx';
import InsightsPanel from '../components/insights/InsightsPanel.jsx';
import AlertsPanel from '../components/alerts/AlertsPanel.jsx';
import { astronautService } from '../services/astronautService.js';
import { useFetch } from '../hooks/useFetch.js';

const TABS = [
  ['profile', 'Profile'],
  ['baselines', 'Baselines & performance'],
  ['muscle', 'Muscle dashboard'],
  ['exercise', 'Exercise history'],
  ['sensors', 'Sensor data'],
  ['insights', 'Insights'],
  ['alerts', 'Alerts'],
];

export default function AstronautDetails() {
  const { id } = useParams();
  const [tab, setTab] = useState('profile');
  const astronaut = useFetch(() => astronautService.get(id), [id]);
  const a = astronaut.data;

  if (astronaut.error) {
    return (
      <>
        <PageHeader title="Astronaut not found" breadcrumbs={[{ label: 'Astronauts', to: '/astronauts' }, { label: id }]} />
        <ErrorState message={astronaut.error} onRetry={astronaut.reload} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={a?.name ?? 'Astronaut profile'}
        subtitle={a ? `${a.id} · ${a.missionName ?? 'No mission'} · Demonstration record` : 'Loading profile…'}
        breadcrumbs={[{ label: 'Astronauts', to: '/astronauts' }, { label: a?.name ?? id }]}
        actions={(
          <div className="flex gap-2">
            <Link to="/astronauts" className="btn-ghost"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Back</Link>
            <Link to={`/reports?astronautId=${encodeURIComponent(id)}`} className="btn-secondary"><FileBarChart className="h-4 w-4" aria-hidden="true" />Create report</Link>
          </div>
        )}
      />

      {!a ? <Skeleton className="h-64" /> : (
        <>
          <div role="tablist" aria-label="Astronaut profile sections" className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-700/50 bg-space-850/60 p-1 scrollbar-thin">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                role="tab"
                id={`tab-${key}`}
                aria-selected={tab === key}
                aria-controls={`panel-${key}`}
                onClick={() => setTab(key)}
                className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${tab === key ? 'bg-gradient-to-r from-accent to-cyan-400 text-white shadow-glow' : 'text-slate-300 hover:bg-space-700/70 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="flex flex-col gap-6">
            {tab === 'profile' && <Card title="Profile and mission status"><AstronautProfile astronaut={a} /></Card>}
            {tab === 'baselines' && <AssessmentPanel astronautId={id} />}
            {tab === 'muscle' && <MuscleDashboard astronautId={id} />}
            {tab === 'exercise' && <ExerciseHistory astronautId={id} title="Exercise history" subtitle="Prescribed and completed countermeasure sessions for this astronaut." />}
            {tab === 'sensors' && <SensorPanel astronautId={id} title="Sensor measurements for this astronaut" />}
            {tab === 'insights' && <InsightsPanel astronautId={id} />}
            {tab === 'alerts' && <AlertsPanel astronautId={id} />}
          </div>
        </>
      )}
    </>
  );
}
