// components/dashboard/transaction-activity-chart.tsx
"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {useTheme} from "next-themes";
import type {Transaction} from "@/types/database";
import {useMemo} from "react";

interface TransactionActivityChartProps {
  transactions: Transaction[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{value: number; dataKey: string}>;
  label?: string;
}

const CustomTooltip = ({active, payload, label}: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;

  const income = payload.find((p) => p.dataKey === "income")?.value || 0;
  const expenses = payload.find((p) => p.dataKey === "expenses")?.value || 0;
  const count = payload.find((p) => p.dataKey === "count")?.value || 0;

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <div className="space-y-1">
        <p className="text-xs flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Income:</span>
          <span className="font-semibold text-emerald-600">
            {new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(income)}
          </span>
        </p>
        <p className="text-xs flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Expenses:</span>
          <span className="font-semibold text-rose-600">
            {new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(expenses)}
          </span>
        </p>
        <p className="text-xs flex items-center justify-between gap-3 pt-1 border-t">
          <span className="text-muted-foreground">Transactions:</span>
          <span className="font-semibold">{count}</span>
        </p>
      </div>
    </div>
  );
};

export function TransactionActivityChart({transactions}: TransactionActivityChartProps) {
  const {theme} = useTheme();
  const isDark = theme === "dark";

  const data = useMemo(() => {
    // Group by day for last 14 days
    const days: Record<string, {income: number; expenses: number; count: number}> = {};

    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString("en-US", {month: "short", day: "numeric"});
      days[key] = {income: 0, expenses: 0, count: 0};
    }

    // Calculate daily totals
    transactions
      .filter((t) => t.status === "completed")
      .forEach((t) => {
        const key = new Date(t.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        if (key in days) {
          const amount = Number(t.amount);
          days[key].count += 1;

          if (t.type === "deposit") {
            days[key].income += amount;
          } else if (
            ["internal_transfer", "external_transfer", "bill_payment", "withdrawal"].includes(
              t.type,
            )
          ) {
            days[key].expenses += amount;
          }
        }
      });

    return Object.entries(days).map(([date, values]) => ({
      date,
      income: values.income,
      expenses: values.expenses,
      count: values.count,
    }));
  }, [transactions]);

  // Calculate summary stats
  const summary = useMemo(() => {
    const totalIncome = data.reduce((sum, d) => sum + d.income, 0);
    const totalExpenses = data.reduce((sum, d) => sum + d.expenses, 0);
    const totalTransactions = data.reduce((sum, d) => sum + d.count, 0);
    const netCashflow = totalIncome - totalExpenses;

    return {totalIncome, totalExpenses, totalTransactions, netCashflow};
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/20 p-3">
          <p className="text-xs text-muted-foreground">Total Income</p>
          <p className="text-lg font-bold text-emerald-600">
            {new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(
              summary.totalIncome,
            )}
          </p>
        </div>
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-3">
          <p className="text-xs text-muted-foreground">Total Expenses</p>
          <p className="text-lg font-bold text-rose-600">
            {new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(
              summary.totalExpenses,
            )}
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-lg font-bold text-blue-600">{summary.totalTransactions}</p>
        </div>
        <div
          className={`rounded-lg p-3 ${summary.netCashflow >= 0 ? "bg-green-50 dark:bg-green-950/20" : "bg-orange-50 dark:bg-orange-950/20"}`}>
          <p className="text-xs text-muted-foreground">Net Cashflow</p>
          <p
            className={`text-lg font-bold ${summary.netCashflow >= 0 ? "text-green-600" : "text-orange-600"}`}>
            {new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(
              summary.netCashflow,
            )}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height={192}>
          <BarChart data={data} margin={{top: 5, right: 5, left: -20, bottom: 0}}>
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
              yAxisId="left"
              tick={{fontSize: 10, fill: isDark ? "#64748b" : "#94a3b8"}}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{fontSize: 10, fill: isDark ? "#64748b" : "#94a3b8"}}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="income"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              name="Income"
              barSize={25}
            />
            <Bar
              yAxisId="left"
              dataKey="expenses"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              name="Expenses"
              barSize={25}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
