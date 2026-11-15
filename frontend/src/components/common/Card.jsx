/** Content container used across pages. `glass` adds the selective glass treatment for key panels. */
export default function Card({ title, subtitle, scope, actions, children, className = '', glass = false, bodyClass = '', id }) {
  return (
    <section id={id} className={`${glass ? 'glass' : 'panel'} ${className} print-area`}>
      {(title || actions) && (
        <header className="dashboard-card-header flex flex-wrap items-start justify-between gap-3 border-b border-slate-700/40 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-primary">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-sm text-secondary">{subtitle}</p>}
            {scope && <p className="mt-1 text-xs text-muted">{scope}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2 no-print">{actions}</div>}
        </header>
      )}
      <div className={`p-5 ${bodyClass}`}>{children}</div>
    </section>
  );
}
