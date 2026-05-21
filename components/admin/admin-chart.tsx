"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import {useTheme} from "next-themes";

interface DailyPoint {
  date: string;
  volume: number;
  count: number;
}

const CustomTooltip = ({active, payload, label}: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-medium mb-1">{label}</p>
      <p className="text-blue-500">
        Volume:{" "}
        {new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          notation: "compact",
        }).format(payload[0]?.value ?? 0)}
      </p>
      <p className="text-violet-500">Transactions: {payload[1]?.value ?? 0}</p>
    </div>
  );
};

export function AdminChart({data}: {data: DailyPoint[]}) {
  const {theme} = useTheme();
  const isDark = theme === "dark";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{top: 5, right: 5, left: -15, bottom: 0}}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={isDark ? "#1e293b" : "#f1f5f9"}
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{fontSize: 10, fill: isDark ? "#64748b" : "#94a3b8"}}
          tickLine={false}
          axisLine={false}
          interval={1}
        />
        <YAxis
          yAxisId="volume"
          tick={{fontSize: 10, fill: isDark ? "#64748b" : "#94a3b8"}}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          yAxisId="count"
          orientation="right"
          tick={{fontSize: 10, fill: isDark ? "#64748b" : "#94a3b8"}}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          yAxisId="volume"
          dataKey="volume"
          fill="#3b82f6"
          opacity={0.8}
          radius={[4, 4, 0, 0]}
          name="Volume"
        />
        <Line
          yAxisId="count"
          type="monotone"
          dataKey="count"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          name="Transactions"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
