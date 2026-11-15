import DataValue from '../common/DataValue.jsx';

const TONES = {
  cyan: { icon: 'bg-status-info-bg text-status-info' },
  ok: { icon: 'bg-status-ok-bg text-status-ok' },
  attention: { icon: 'bg-status-attention-bg text-status-attention' },
  critical: { icon: 'bg-status-critical-bg text-status-critical' },
  violet: { icon: 'bg-status-violet-bg text-status-violet' },
};

/** Command-centre KPI: title, large value, supporting description, icon and optional trend. */
export default function KPICard({ title, value, unit, description, icon: Icon, tone = 'cyan', trend, state = 'value', message, hint, scope, simulated, onRetry, valueTone }) {
  const t = TONES[tone] ?? TONES.cyan;
  const display = typeof value === 'number' ? value.toLocaleString('en-GB', {
    minimumFractionDigits: unit === '%' ? 1 : 0,
    maximumFractionDigits: unit === '%' ? 1 : 0,
  }) : value;
  return (
    <article className="panel flex min-h-36 flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-secondary">{title}</p>
        {Icon && (
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${t.icon}`}>
            <Icon className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className={`mt-3 text-[28px] font-semibold leading-tight tracking-tight ${valueTone === 'ok' ? 'text-status-ok' : 'text-accent-link'}`}>
        <DataValue state={state} value={display} unit={unit} message={message} hint={hint} simulated={simulated} onRetry={onRetry} className={state === 'value' ? '' : 'text-base'} />
      </div>
      <p className="mt-auto pt-2 text-xs leading-relaxed text-muted">{description}</p>
      {scope && <p className="mt-1 text-xs text-muted">{scope}</p>}
      {trend && <p className="mt-2 text-xs font-medium text-accent-link">{trend}</p>}
    </article>
  );
}
