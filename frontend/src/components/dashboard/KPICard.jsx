import { formatNumber } from '../../utils/formatters.js';

const TONES = {
  cyan: { icon: 'from-accent to-cyan-500', value: 'text-white' },
  ok: { icon: 'from-emerald-600 to-emerald-400', value: 'text-emerald-200' },
  attention: { icon: 'from-amber-600 to-amber-400', value: 'text-amber-200' },
  critical: { icon: 'from-red-700 to-red-500', value: 'text-red-200' },
  violet: { icon: 'from-indigo-600 to-violet-500', value: 'text-white' },
};

/** Command-centre KPI: title, large value, supporting description, icon and optional trend. */
export default function KPICard({ title, value, unit, description, icon: Icon, tone = 'cyan', trend }) {
  const t = TONES[tone] ?? TONES.cyan;
  const display = value === null || value === undefined ? '—' : typeof value === 'number' ? formatNumber(value, unit === '%' ? 1 : 0) : value;
  return (
    <article className="glass group relative overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-400/30">
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-accent/10 blur-2xl transition group-hover:bg-cyan-400/15" aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        {Icon && (
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${t.icon} text-white shadow-glow`}>
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className={`mt-3 text-3xl font-bold tabular-nums tracking-tight ${t.value}`}>
        {display}
        {unit && value !== null && value !== undefined && <span className="ml-1 text-base font-semibold text-slate-400">{unit}</span>}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{description}</p>
      {trend && <p className="mt-2 text-xs font-medium text-cyan-300/90">{trend}</p>}
    </article>
  );
}
