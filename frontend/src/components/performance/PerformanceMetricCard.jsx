import { Eye, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import Button from '../common/Button.jsx';
import StatusBadge, { DataSourceBadge } from '../common/StatusBadge.jsx';
import { formatDate, formatNumber, formatPercent, DIRECTION_TEXT } from '../../utils/formatters.js';

/** Metric card: current value, individual baseline, absolute and % difference, date, trend, source and history action. */
export default function PerformanceMetricCard({ def, info, onViewHistory }) {
  const dir = info.trend.direction;
  const Trend = dir === 'rising' ? TrendingUp : dir === 'falling' ? TrendingDown : Minus;
  const trendTone = dir === 'falling' ? 'attention' : dir === 'rising' ? 'info' : 'neutral';
  const noData = info.latest === null;
  return (
    <article className="glass flex flex-col gap-4 p-5" aria-label={`${def.label} metric`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{def.label}</p>
          <p className="mt-1 text-[11px] text-slate-500">{def.measurement}</p>
        </div>
        <StatusBadge tone={trendTone}><Trend className="h-3 w-3" aria-hidden="true" />{DIRECTION_TEXT[dir]}</StatusBadge>
      </div>

      <div>
        <p className="text-3xl font-bold tabular-nums tracking-tight text-primary">
          {noData ? '—' : formatNumber(info.latest, def.decimals)}
          <span className="ml-1.5 text-sm font-medium text-slate-400">{def.unit}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">Current measurement · {noData ? 'none recorded' : formatDate(info.latestDate)}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="label-muted">Individual baseline</dt><dd className="mt-1 font-semibold tabular-nums text-slate-200">{info.baseline === null ? 'No baseline' : `${formatNumber(info.baseline, def.decimals)} ${def.unit}`}</dd></div>
        <div><dt className="label-muted">Difference</dt><dd className="mt-1 font-semibold tabular-nums text-slate-200">{info.difference === null ? '—' : `${info.difference > 0 ? '+' : ''}${formatNumber(info.difference, def.decimals)}`}</dd></div>
        <div>
          <dt className="label-muted">{def.kind === 'percent' ? '% change' : 'Change (points)'}</dt>
          <dd className="mt-1 font-semibold tabular-nums text-cyan-200">{def.kind === 'percent' ? (info.percent === null ? 'not valid' : formatPercent(info.percent)) : (info.difference === null ? '—' : formatNumber(info.difference, 1))}</dd>
        </div>
        <div><dt className="label-muted">Records</dt><dd className="mt-1 font-semibold tabular-nums text-slate-200">{info.count}</dd></div>
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/40 pt-3">
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          {info.latestSource && <DataSourceBadge source={info.latestSource} />}
          <span>Data source</span>
        </div>
        <Button size="sm" variant="secondary" icon={Eye} onClick={onViewHistory} disabled={noData}>View history</Button>
      </div>
    </article>
  );
}
