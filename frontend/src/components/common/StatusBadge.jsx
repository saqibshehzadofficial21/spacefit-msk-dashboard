import { DATA_SOURCE_LABELS } from '../../utils/constants.js';

const TONES = {
  ok: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300',
  attention: 'border-amber-400/40 bg-amber-500/10 text-amber-300',
  critical: 'border-red-400/50 bg-red-500/15 text-red-300',
  info: 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300',
  neutral: 'border-slate-500/40 bg-slate-500/10 text-slate-300',
  violet: 'border-violet-400/40 bg-violet-500/10 text-violet-200',
};
const DOT = { ok: 'bg-emerald-400', attention: 'bg-amber-400', critical: 'bg-red-400', info: 'bg-cyan-400', neutral: 'bg-slate-400', violet: 'bg-violet-400' };

export default function StatusBadge({ tone = 'neutral', children, dot = false, className = '' }) {
  return (
    <span className={`chip ${TONES[tone] ?? TONES.neutral} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone] ?? DOT.neutral}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

const SOURCE_SHORT = { simulated: 'SIMULATED', manual: 'MANUAL', 'actual-sensor': 'ACTUAL SENSOR', 'ai-generated': 'AI-GENERATED', 'nasa-reference': 'NASA REFERENCE' };
const SOURCE_TONE = { simulated: 'violet', manual: 'info', 'actual-sensor': 'ok', 'ai-generated': 'neutral', 'nasa-reference': 'neutral' };

/** Provenance badge. Every important record shows where its data came from. */
export function DataSourceBadge({ source }) {
  if (!source) return null;
  return (
    <StatusBadge tone={SOURCE_TONE[source] ?? 'neutral'} className="whitespace-nowrap" >
      <span title={DATA_SOURCE_LABELS[source]}>{SOURCE_SHORT[source] ?? source.toUpperCase()}</span>
    </StatusBadge>
  );
}
