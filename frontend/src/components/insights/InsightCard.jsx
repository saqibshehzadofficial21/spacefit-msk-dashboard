import { CheckCircle2, Flag, Sparkles } from 'lucide-react';
import Button from '../common/Button.jsx';
import StatusBadge, { DataSourceBadge } from '../common/StatusBadge.jsx';
import { formatDate, formatNumber, formatPercent, SEVERITY_TEXT, SEVERITY_TONE, STATUS_TONE } from '../../utils/formatters.js';
import { INSIGHT_REVIEW } from '../../utils/constants.js';

/**
 * AI insight card. Labels the source of the explanation: rule engine always; optional narrative only when configured.
 * Wording describes measurement differences from the individual baseline. It never states a diagnosis.
 */
export default function InsightCard({ insight, onReview, canReview, compact = false }) {
  const reviewLabel = INSIGHT_REVIEW.find((r) => r.value === insight.reviewStatus)?.label ?? insight.reviewStatus;
  return (
    <article className="glass p-5 transition hover:border-cyan-400/30" aria-labelledby={`ins-${insight.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-mono text-slate-500">{insight.id}</p>
          <h3 id={`ins-${insight.id}`} className="mt-0.5 text-base font-semibold text-white">{insight.metricName}</h3>
          <p className="mt-0.5 text-xs text-slate-400">{insight.astronautId} · measured {formatDate(insight.measurementDate)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge tone={SEVERITY_TONE[insight.severity]} dot>{SEVERITY_TEXT[insight.severity]}</StatusBadge>
          <StatusBadge tone={STATUS_TONE[insight.reviewStatus] ?? 'neutral'}>{reviewLabel}</StatusBadge>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div><dt className="label-muted">Baseline</dt><dd className="mt-1 font-semibold tabular-nums text-slate-200">{formatNumber(insight.baselineValue, 2)} <span className="text-xs font-normal text-slate-500">{insight.unit}</span></dd></div>
        <div><dt className="label-muted">Current</dt><dd className="mt-1 font-semibold tabular-nums text-slate-200">{formatNumber(insight.currentValue, 2)} <span className="text-xs font-normal text-slate-500">{insight.unit}</span></dd></div>
        <div><dt className="label-muted">Difference</dt><dd className="mt-1 font-semibold tabular-nums text-slate-200">{insight.difference === null ? '—' : `${insight.difference > 0 ? '+' : ''}${formatNumber(insight.difference, 2)} ${insight.unit}`}</dd></div>
        <div><dt className="label-muted">Change</dt><dd className="mt-1 font-semibold tabular-nums text-cyan-200">{insight.percentChange === null ? 'not valid' : formatPercent(insight.percentChange)}</dd></div>
      </dl>

      {!compact && (
        <>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">{insight.explanation}</p>
          <p className="mt-3 rounded-lg border border-cyan-400/15 bg-accent/5 px-3 py-2 text-xs leading-relaxed text-cyan-100/90"><span className="font-semibold">Suggested next action: </span>{insight.suggestedAction}</p>
          {insight.narrative && (
            <p className="mt-3 text-xs italic text-slate-300">Optional narrative ({insight.narrative.source}): {insight.narrative.text}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
            <span>Source: rule-based engine{insight.narrative ? ' + optional narrative provider' : ''}</span>
            <DataSourceBadge source={insight.dataSource} />
            <span className="ml-auto">{(insight.supportingRecordIds ?? []).length} supporting record(s)</span>
          </div>
        </>
      )}

      {canReview && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-700/40 pt-4">
          <Button size="sm" variant="secondary" icon={CheckCircle2} onClick={() => onReview(insight, 'reviewed')} disabled={insight.reviewStatus === 'reviewed'}>Mark reviewed</Button>
          <Button size="sm" variant="secondary" icon={Flag} onClick={() => onReview(insight, 'referred-to-specialist')} disabled={insight.reviewStatus === 'referred-to-specialist'}>Refer to specialist</Button>
        </div>
      )}
    </article>
  );
}
