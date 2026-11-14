import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import ChartFrame from './ChartFrame.jsx';
import { COLORS, axisProps, tooltipStyle } from './chartTheme.js';

/** Grouped bars. `bars`: [{ key, label, color }]. Used for phase comparisons and baseline-vs-current views. */
export default function BarCompare({ data, bars, height = 280, label = 'Comparison chart', unit = '', signed = false }) {
  const hasData = data.some((row) => bars.some((b) => typeof row[b.key] === 'number'));
  return (
    <ChartFrame height={height} hasData={hasData} label={label}>
      <BarChart data={data} margin={{ top: 10, right: 12, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="x" {...axisProps} />
        <YAxis {...axisProps} width={48} />
        <Tooltip {...tooltipStyle} formatter={(v, name) => [`${Number(v).toLocaleString('en-GB', { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ''}`, name]} />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12, color: COLORS.text }} />}
        {signed && <ReferenceLine y={0} stroke={COLORS.axis} />}
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.label} fill={b.color ?? COLORS.blue} radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {signed && data.map((row, i) => (
              <Cell key={i} fill={(row[b.key] ?? 0) < 0 ? COLORS.crit : COLORS.ok} />
            ))}
          </Bar>
        ))}
      </BarChart>
    </ChartFrame>
  );
}
