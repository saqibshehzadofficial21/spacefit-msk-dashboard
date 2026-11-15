import { Activity, ClipboardList, Dumbbell } from 'lucide-react';
import { PHASES } from '../../utils/constants.js';

/** Activity across preflight, in-flight and postflight. Bars are relative to the busiest phase. */
export default function MissionTimeline({ timeline }) {
  const max = Math.max(1, ...timeline.flatMap((t) => [t.exerciseRecords, t.performanceAssessments, t.sensorMeasurements]));
  return (
    <ol className="grid gap-3 md:grid-cols-3">
      {timeline.map((t, idx) => {
        const phase = PHASES.find((p) => p.value === t.phase);
        const total = t.exerciseRecords + t.performanceAssessments + t.sensorMeasurements;
        return (
          <li key={t.phase} className="relative min-w-0 rounded-xl border border-border-subtle bg-surface-sunken p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-secondary">Phase {idx + 1}</span>
              <span className="text-xs text-muted tabular-nums">{total} records</span>
            </div>
            <p className="mt-1 text-base font-semibold text-primary">{phase?.label}</p>
            {total === 0 ? <p className="mt-3 text-sm text-muted">No records in this phase.</p> : <div className="mt-3 flex flex-col gap-2 text-sm text-secondary">
              {[
                { icon: Dumbbell, label: 'Exercise records', value: t.exerciseRecords },
                { icon: ClipboardList, label: 'Performance assessments', value: t.performanceAssessments },
                { icon: Activity, label: 'Sensor measurements', value: t.sensorMeasurements },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5"><row.icon className="h-4 w-4 shrink-0 text-accent-link" aria-hidden="true" />{row.label}</span><span className="tabular-nums">{row.value}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface"><div className="h-full rounded-full bg-[var(--chart-blue)]" style={{ width: `${(row.value / max) * 100}%` }} /></div>
                </div>
              ))}
            </div>}
          </li>
        );
      })}
    </ol>
  );
}
