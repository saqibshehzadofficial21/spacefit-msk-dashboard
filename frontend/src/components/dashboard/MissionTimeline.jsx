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
          <li key={t.phase} className="relative rounded-xl border border-slate-700/50 bg-space-900/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Step {idx + 1}</span>
              <span className="text-xs text-slate-500 tabular-nums">{total} record(s)</span>
            </div>
            <p className="mt-1 text-base font-semibold text-white">{phase?.label}</p>
            <div className="mt-3 flex flex-col gap-2 text-xs text-slate-300">
              {[
                { icon: Dumbbell, label: 'Exercise records', value: t.exerciseRecords },
                { icon: ClipboardList, label: 'Performance assessments', value: t.performanceAssessments },
                { icon: Activity, label: 'Sensor measurements', value: t.sensorMeasurements },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1 flex items-center justify-between"><span className="flex items-center gap-1.5"><row.icon className="h-3.5 w-3.5 text-cyan-300/80" aria-hidden="true" />{row.label}</span><span className="tabular-nums">{row.value}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-space-700"><div className="h-full rounded-full bg-gradient-to-r from-accent to-cyan-400" style={{ width: `${(row.value / max) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
