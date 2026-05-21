"use client";

import {AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer} from "recharts";
import {useTheme} from "next-themes";
import type {Transaction} from "@/types/database";
import {useMemo} from "react";

interface SpendingChartProps {
  transactions: Transaction[];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{value: number}>;
  label?: string;
}

const CustomTooltip = ({active, payload, label}: TooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">
        {new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(
          payload[0].value,
        )}
      </p>
    </div>
  );
};

export function SpendingChart({transactions}: SpendingChartProps) {
  const {theme} = useTheme();
  const isDark = theme === "dark";

  const data = useMemo(() => {
    // Group spending by day for last 30 days
    const days: Record<string, number> = {};

    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", {month: "short", day: "numeric"});
      days[key] = 0;
    }

    transactions
      .filter(
        (t) =>
          ["internal_transfer", "external_transfer", "bill_payment", "withdrawal"].includes(
            t.type,
          ) && t.status === "completed",
      )
      .forEach((t) => {
        const key = new Date(t.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (key in days) days[key] += Number(t.amount);
      });

    return Object.entries(days).map(([date, amount]) => ({date, amount}));
  }, [transactions]);

  return (
    <ResponsiveContainer width="100%" height={192}>
      <AreaChart data={data} margin={{top: 5, right: 5, left: -20, bottom: 0}}>
        <defs>
          <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          interval={6}
        />
        <YAxis
          tick={{fontSize: 10, fill: isDark ? "#64748b" : "#94a3b8"}}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#spendGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
