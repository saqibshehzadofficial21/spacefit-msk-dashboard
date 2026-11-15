import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';
import ChartFrame from './ChartFrame.jsx';
import { COLORS, axisProps, tooltipStyle } from './chartTheme.js';

/**
 * Multi-series line chart. `series`: [{ key, label, color? }]. `references`: [{ y, label, color? }].
 * Data rows: { x: 'YYYY-MM-DD', [seriesKey]: number }.
 */
export default function TrendChart({ data, series, references = [], height = 240, unit = '', label = 'Trend chart', emptyText, xFormatter, yDomain, tooltipFormatter }) {
  const hasData = data.length > 0 && series.some((s) => data.some((row) => typeof row[s.key] === 'number'));
  return (
    <ChartFrame
      height={height}
      hasData={hasData}
      label={label}
      emptyText={emptyText}
      tableColumns={['Date', ...series.map((item) => item.label)]}
      tableRows={data.map((row) => [row.x, ...series.map((item) => row[item.key] ?? 'No value')])}
    >
      <LineChart data={data} margin={{ top: 10, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="x" {...axisProps} minTickGap={24} tickFormatter={xFormatter} />
        <YAxis {...axisProps} width={52} domain={yDomain ?? ['auto', 'auto']} tickFormatter={(v) => (typeof v === 'number' ? v.toLocaleString('en-GB', { maximumFractionDigits: 1 }) : v)} unit={unit ? ` ${unit}` : undefined} />
        <Tooltip {...tooltipStyle} formatter={(v, name, entry) => [tooltipFormatter ? tooltipFormatter(v, name, entry) : `${typeof v === 'number' ? v.toLocaleString('en-GB', { maximumFractionDigits: 2 }) : v}${unit ? ` ${unit}` : ''}`, name]} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: COLORS.text }} />}
        {references.map((r) => (
          <ReferenceLine key={`${r.label}-${r.y}`} y={r.y} stroke={r.color ?? COLORS.cyan} strokeDasharray="5 4" label={{ value: r.label, fill: COLORS.text, fontSize: 12, position: 'insideTopRight' }} />
        ))}
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? COLORS.series[i % COLORS.series.length]}
            strokeWidth={2.2}
            dot={{ r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartFrame>
  );
}
