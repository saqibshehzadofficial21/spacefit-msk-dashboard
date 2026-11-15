import { useMemo, useState } from 'react';
import { ArrowDownAZ, ArrowUpAZ, ArrowUpDown } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner.jsx';
import EmptyState from './EmptyState.jsx';

/**
 * Responsive data table with client-side sorting. Horizontal scroll on small screens keeps columns readable.
 * columns: [{ key, label, render?(row), sortValue?(row), align?, className? }]
 */
export default function DataTable({ columns, rows, rowKey = 'id', onRowClick, loading = false, emptyTitle = 'No records', emptyText, emptyAction, compact = false, responsiveCards = false }) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' });

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const col = columns.find((c) => c.key === sort.key);
    const value = (row) => (col?.sortValue ? col.sortValue(row) : row[sort.key]);
    return [...rows].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'en');
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sort, columns]);

  const toggle = (key) => setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  if (loading && !rows.length) return <LoadingSpinner label="Loading records" />;
  if (!rows.length) return <EmptyState title={emptyTitle} description={emptyText} action={emptyAction} />;

  return (
    <div className={`overflow-x-auto rounded-xl border border-border-subtle scrollbar-thin ${responsiveCards ? 'responsive-data-table' : ''}`}>
      <table className="min-w-full divide-y divide-border-subtle">
        <thead className="bg-surface-sunken">
          <tr>
            {columns.map((col) => {
              const active = sort.key === col.key;
              const Icon = !col.sortable ? null : active ? (sort.dir === 'asc' ? ArrowUpAZ : ArrowDownAZ) : ArrowUpDown;
              return (
                <th key={col.key} scope="col" className={`table-th ${col.align === 'right' ? 'text-right' : ''} ${col.thClass ?? ''}`} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {col.sortable ? (
                    <button type="button" onClick={() => toggle(col.key)} className="inline-flex items-center gap-1 hover:text-primary focus-visible:ring-2 focus-visible:ring-accent">
                      {col.label}
                      <Icon className={`h-3.5 w-3.5 ${active ? 'text-accent-link' : 'text-muted'}`} aria-hidden="true" />
                    </button>
                  ) : col.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle bg-surface">
          {sorted.map((row, idx) => (
            <tr
              key={row[rowKey] ?? idx}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(row); } : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              className={`transition duration-150 ${onRowClick ? 'cursor-pointer hover:bg-surface-raised focus-visible:bg-surface-raised' : 'hover:bg-surface-raised'}`}
            >
              {columns.map((col) => (
                <td key={col.key} data-label={col.label} className={`${compact ? 'px-3 py-2' : 'table-td'} ${col.align === 'right' ? 'text-right' : ''} ${col.className ?? ''}`}>
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
