import { DATA_SOURCE_LABELS } from '../../utils/constants.js';
import { formatDateTime } from '../../utils/formatters.js';
import StatusBadge from '../common/StatusBadge.jsx';

/** Printable, professional report view: scope, KPI summary, tables, notes and data-source information. */
export default function ReportPreview({ report }) {
  return (
    <article className="panel print-area p-6 sm:p-8" aria-label={`Report preview: ${report.title}`}>
      <header className="flex flex-col gap-2 border-b border-slate-700/40 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Astronaut MSK monitoring prototype</p>
        <h2 className="text-2xl font-bold text-white">{report.title}</h2>
        <p className="text-xs text-slate-400">Generated {formatDateTime(report.generatedAt)} · {report.recordCount} stored record(s) in scope · ID {report.id}</p>
      </header>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['Astronaut', report.scope.astronaut], ['Mission', report.scope.mission], ['Mission phase', report.scope.missionPhase],
          ['Reporting period', report.scope.period], ['Equipment', report.scope.equipment], ['Category', report.scope.category], ['Metric', report.scope.metric],
        ].map(([k, v]) => <div key={k}><dt className="label-muted">{k}</dt><dd className="mt-0.5 text-slate-100">{v}</dd></div>)}
      </dl>

      {report.kpis?.length > 0 && (
        <section className="mt-6" aria-labelledby="kpi-sum">
          <h3 id="kpi-sum" className="mb-3 text-sm font-semibold text-white">KPI summary</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {report.kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-slate-700/50 bg-space-900/50 p-3">
                <p className="text-xs text-slate-400">{k.label}</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-white">{k.value ?? '—'}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {report.sections.map((section) => (
        <section key={section.title} className="mt-8" aria-label={section.title}>
          <h3 className="mb-3 text-sm font-semibold text-white">{section.title}</h3>
          {section.rows.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">No records in this section for the selected filters.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/40 scrollbar-thin">
              <table className="min-w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-space-900/70">
                  <tr>{section.columns.map((c) => <th key={c} scope="col" className="table-th whitespace-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {section.rows.slice(0, 200).map((row, i) => (
                    <tr key={i} className="hover:bg-space-800/60">
                      {row.map((cell, j) => <td key={j} className="table-td whitespace-nowrap text-xs sm:text-sm">{cell === null || cell === undefined ? '—' : String(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {(section.truncated || section.rows.length > 200) && <p className="mt-2 text-xs text-slate-500">Preview shows the first 200 of {section.totalRows} rows. The CSV export includes the rows stored in this report (up to 500 per section).</p>}
        </section>
      ))}

      <section className="mt-8 grid gap-6 md:grid-cols-2" aria-labelledby="src-heading">
        <div>
          <h3 id="src-heading" className="mb-2 text-sm font-semibold text-white">Data source information</h3>
          {report.dataSourceSummary.length === 0 ? <p className="text-sm text-slate-400">No records in scope.</p> : (
            <ul className="flex flex-col gap-2">
              {report.dataSourceSummary.map((d) => (
                <li key={d.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-slate-300">{DATA_SOURCE_LABELS[d.key] ?? d.label}</span>
                  <StatusBadge tone={d.key === 'simulated' ? 'violet' : 'info'}>{d.count} record(s)</StatusBadge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-white">Notes and limitations</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-400">
            {report.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        </div>
      </section>
    </article>
  );
}
