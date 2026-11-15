import { ResponsiveContainer } from 'recharts';

/** Responsive chart wrapper with an accessible text fallback when there is no data. */
export default function ChartFrame({ height = 280, hasData, emptyText = 'No records for this filter.', children, label, tableColumns, tableRows = [] }) {
  if (!hasData) {
    return (
      <div style={{ height }} className="grid min-w-0 place-items-center rounded-xl border border-dashed border-border-subtle bg-surface-sunken px-6 text-center text-sm text-muted" role="img" aria-label={`${label ?? 'Chart'}: no data`}>
        <div><p>{emptyText}</p><p className="mt-1 text-xs">Try a wider date range or clear the mission filter.</p></div>
      </div>
    );
  }
  return (
    <>
      <div style={{ height, width: '100%' }} className="min-w-0" role="img" aria-label={label}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
      {tableColumns && (
        <div className="sr-only">
          <table className="w-px table-fixed">
            <caption>{label}</caption>
            <thead><tr>{tableColumns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>{tableRows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell ?? 'No value'}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </>
  );
}
