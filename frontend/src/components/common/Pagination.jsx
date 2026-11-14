import Button from './Button.jsx';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) {
    return meta?.total ? <p className="mt-3 text-xs text-slate-500">{meta.total} record(s)</p> : null;
  }
  const start = (meta.page - 1) * meta.pageSize + 1;
  const end = Math.min(meta.page * meta.pageSize, meta.total);
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
      <span>Showing {start}–{end} of {meta.total}</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</Button>
        <span className="tabular-nums">Page {meta.page} of {meta.totalPages}</span>
        <Button size="sm" variant="secondary" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next</Button>
      </div>
    </div>
  );
}
