import { Skeleton } from './LoadingSpinner.jsx';

const STATE_TEXT = {
  empty: 'No records for this filter',
  'no-data': 'No data yet',
  'not-applicable': 'Not available',
};

export default function DataValue({
  state = 'value',
  value,
  unit = '',
  message,
  hint,
  simulated = false,
  onRetry,
  className = '',
}) {
  if (state === 'loading') return <Skeleton className={`h-8 w-24 ${className}`} />;
  if (state === 'error') {
    return (
      <div className={`text-sm text-status-critical ${className}`} role="alert">
        <p>{hint || 'This value could not be loaded.'}</p>
        {onRetry && <button type="button" className="mt-1 font-semibold underline" onClick={onRetry}>Retry</button>}
      </div>
    );
  }
  if (state !== 'value') {
    return (
      <div className={className}>
        <p className="text-sm font-semibold text-primary">{message || STATE_TEXT[state] || 'Not available'}</p>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
    );
  }

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-1 ${className}`}>
      <span className="tabular-nums">{value}</span>
      {unit && <span className="text-base font-semibold text-secondary">{unit}</span>}
      {simulated && (
        <span className="simulated-badge rounded-full border px-2 py-0.5 text-xs font-semibold" title="Includes simulated demonstration values, not hardware measurements.">
          Simulated
        </span>
      )}
    </span>
  );
}
