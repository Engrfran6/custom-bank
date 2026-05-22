// components/dashboard/transaction-activity-chart.tsx
"use client";

import {useMemo} from "react";

import {useTheme} from "next-themes";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import type {TransactionHistory} from "@/lib/mapper/db-transaction-to-user";

interface TransactionActivityChartProps {
  transactions: TransactionHistory[];
}

interface ChartPoint {
  date: string;
  income: number;
  expenses: number;
  count: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
  }>;
  label?: string;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatDayKey = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const CustomTooltip = ({active, payload, label}: CustomTooltipProps) => {
  if (!active || !payload?.length) {
    return null;
  }

  const income = Number(payload.find((p) => p.dataKey === "income")?.value ?? 0);

  const expenses = Number(payload.find((p) => p.dataKey === "expenses")?.value ?? 0);

  const count = Number(payload.find((p) => p.dataKey === "count")?.value ?? 0);

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>

      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">Income</span>

          <span className="font-semibold text-emerald-600">{currencyFormatter.format(income)}</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">Expenses</span>

          <span className="font-semibold text-rose-600">{currencyFormatter.format(expenses)}</span>
        </div>

        <div className="flex items-center justify-between gap-3 border-t pt-1 text-xs">
          <span className="text-muted-foreground">Transactions</span>

          <span className="font-semibold">{count}</span>
        </div>
      </div>
    </div>
  );
};

export function TransactionActivityChart({transactions}: TransactionActivityChartProps) {
  const {theme} = useTheme();

  const isDark = theme === "dark";

  const data = useMemo<ChartPoint[]>(() => {
    /**
     * Build 14 day buckets
     */
    const buckets: Record<string, ChartPoint> = {};

    const baseDate = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(baseDate);

      date.setDate(baseDate.getDate() - i);

      const key = formatDayKey(date);

      buckets[key] = {
        date: key,
        income: 0,
        expenses: 0,
        count: 0,
      };
    }

    /**
     * IMPORTANT:
     * TransactionHistory is ENTRY-BASED
     *
     * credit  => money IN
     * debit   => money OUT
     *
     * DO NOT compute from tx.type anymore
     */
    transactions.forEach((entry) => {
      const tx = entry.transaction;

      if (tx.status !== "completed") {
        return;
      }

      const entryDate = new Date(entry.created_at);

      const key = formatDayKey(entryDate);

      const bucket = buckets[key];

      if (!bucket) {
        return;
      }

      const amount = Math.abs(Number(entry.amount) || 0);

      bucket.count += 1;

      if (entry.type === "credit") {
        bucket.income += amount;
      }

      if (entry.type === "debit") {
        bucket.expenses += amount;
      }
    });

    return Object.values(buckets);
  }, [transactions]);

  const summary = useMemo(() => {
    const totalIncome = data.reduce((sum, item) => sum + item.income, 0);

    const totalExpenses = data.reduce((sum, item) => sum + item.expenses, 0);

    const totalTransactions = data.reduce((sum, item) => sum + item.count, 0);

    return {
      totalIncome,
      totalExpenses,
      totalTransactions,
      netCashflow: totalIncome - totalExpenses,
    };
  }, [data]);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/20">
          <p className="text-xs text-muted-foreground">Total Income</p>

          <p className="text-lg font-bold text-emerald-600">
            {currencyFormatter.format(summary.totalIncome)}
          </p>
        </div>

        <div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-950/20">
          <p className="text-xs text-muted-foreground">Total Expenses</p>

          <p className="text-lg font-bold text-rose-600">
            {currencyFormatter.format(summary.totalExpenses)}
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="text-xs text-muted-foreground">Transactions</p>

          <p className="text-lg font-bold text-blue-600">{summary.totalTransactions}</p>
        </div>

        <div
          className={`rounded-lg p-3 ${
            summary.netCashflow >= 0
              ? "bg-green-50 dark:bg-green-950/20"
              : "bg-orange-50 dark:bg-orange-950/20"
          }`}>
          <p className="text-xs text-muted-foreground">Net Cashflow</p>

          <p
            className={`text-lg font-bold ${
              summary.netCashflow >= 0 ? "text-green-600" : "text-orange-600"
            }`}>
            {currencyFormatter.format(summary.netCashflow)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            barCategoryGap={12}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "#1e293b" : "#f1f5f9"}
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{
                fontSize: 10,
                fill: isDark ? "#64748b" : "#94a3b8",
              }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              tick={{
                fontSize: 10,
                fill: isDark ? "#64748b" : "#94a3b8",
              }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${v}`}
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend />

            <Bar
              dataKey="income"
              name="Income"
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              maxBarSize={24}
            />

            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
