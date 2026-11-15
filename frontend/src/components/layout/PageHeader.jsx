import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function PageHeader({ title, subtitle, breadcrumbs = [], actions }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="no-print mb-2">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
              {breadcrumbs.map((b, i) => (
                <li key={`${b.label}-${i}`} className="flex items-center gap-1.5">
                  {b.to ? <Link to={b.to} className="text-secondary hover:text-accent-link">{b.label}</Link> : <span className="text-muted">{b.label}</span>}
                  {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3" aria-hidden="true" />}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-primary text-balance">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-secondary">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
