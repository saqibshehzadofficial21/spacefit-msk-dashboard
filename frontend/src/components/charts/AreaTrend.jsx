import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import ChartFrame from './ChartFrame.jsx';
import { COLORS, axisProps, tooltipStyle } from './chartTheme.js';

/** Gradient-filled area for duration and workload trends. */
export default function AreaTrend({ data, dataKey, name, unit = '', height = 260, label = 'Area trend chart' }) {
  const hasData = data.some((d) => typeof d[dataKey] === 'number' && d[dataKey] > 0);
  return (
    <ChartFrame height={height} hasData={hasData} label={label}>
      <AreaChart data={data} margin={{ top: 10, right: 12, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.cyan} stopOpacity={0.45} />
            <stop offset="100%" stopColor={COLORS.blue} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="x" {...axisProps} minTickGap={20} />
        <YAxis {...axisProps} width={48} />
        <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v).toLocaleString('en-GB')}${unit ? ` ${unit}` : ''}`, name]} />
        <Area type="monotone" dataKey={dataKey} name={name} stroke={COLORS.cyan} strokeWidth={2} fill={`url(#grad-${dataKey})`} isAnimationActive={false} connectNulls />
      </AreaChart>
    </ChartFrame>
  );
}
