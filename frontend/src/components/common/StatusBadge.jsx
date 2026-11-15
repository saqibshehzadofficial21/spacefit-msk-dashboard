import { DATA_SOURCE_LABELS } from '../../utils/constants.js';

const TONES = {
  ok: 'status-ok',
  attention: 'status-attention',
  critical: 'status-critical',
  info: 'status-info',
  neutral: 'status-neutral',
  violet: 'status-violet',
};
const DOT = {
  ok: 'status-dot-ok',
  attention: 'status-dot-attention',
  critical: 'status-dot-critical',
  info: 'status-dot-info',
  neutral: 'status-dot-neutral',
  violet: 'status-dot-violet',
};

export default function StatusBadge({ tone = 'neutral', children, dot = false, className = '' }) {
  return (
    <span className={`chip ${TONES[tone] ?? TONES.neutral} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[tone] ?? DOT.neutral}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

const SOURCE_SHORT = { simulated: 'Simulated', manual: 'Manual', 'actual-sensor': 'Actual sensor', 'ai-generated': 'Rule-based', 'nasa-reference': 'NASA reference' };
const SOURCE_TONE = { simulated: 'violet', manual: 'info', 'actual-sensor': 'ok', 'ai-generated': 'neutral', 'nasa-reference': 'neutral' };

/** Provenance badge. Every important record shows where its data came from. */
export function DataSourceBadge({ source }) {
  if (!source) return null;
  return (
    <StatusBadge tone={SOURCE_TONE[source] ?? 'neutral'} className="whitespace-nowrap">
    <span title={DATA_SOURCE_LABELS[source]}>{source === 'simulated' ? 'Simulated' : SOURCE_SHORT[source] ?? source.toUpperCase()}</span>
    </StatusBadge>
  );
}
