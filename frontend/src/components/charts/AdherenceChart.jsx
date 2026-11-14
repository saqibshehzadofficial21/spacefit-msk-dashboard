import { Bar, CartesianGrid, ComposedChart, Legend, Line, Tooltip, XAxis, YAxis } from 'recharts';
import ChartFrame from './ChartFrame.jsx';
import { COLORS, axisProps, tooltipStyle } from './chartTheme.js';

/** Prescribed vs completed vs missed sessions as bars; adherence percentage as a line on the right axis. */
export default function AdherenceChart({ rows, height = 300 }) {
  const data = rows.map((r) => ({ x: r.period, prescribed: r.prescribed, completed: r.completed, missed: r.missed, adherence: r.adherencePercent }));
  return (
    <ChartFrame height={height} hasData={data.some((d) => d.prescribed > 0)} label="Exercise adherence chart: prescribed, completed and missed sessions">
      <ComposedChart data={data} margin={{ top: 10, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="x" {...axisProps} minTickGap={20} />
        <YAxis yAxisId="count" {...axisProps} width={36} allowDecimals={false} />
        <YAxis yAxisId="pct" orientation="right" {...axisProps} width={44} domain={[0, 100]} unit="%" />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12, color: COLORS.text }} />
        <Bar yAxisId="count" dataKey="prescribed" name="Prescribed" fill="rgba(148,163,184,0.45)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar yAxisId="count" dataKey="completed" name="Completed" fill={COLORS.blue} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar yAxisId="count" dataKey="missed" name="Missed" fill={COLORS.crit} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Line yAxisId="pct" type="monotone" dataKey="adherence" name="Adherence %" stroke={COLORS.cyan} strokeWidth={2.4} dot={{ r: 3 }} connectNulls isAnimationActive={false} />
      </ComposedChart>
    </ChartFrame>
  );
}
