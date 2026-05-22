// components/dashboard/sections/spending-chart-section.tsx
"use client";

import {Receipt} from "lucide-react";

import {SpendingChart} from "../spending-chart";

import type {TransactionHistory} from "@/lib/mapper/db-transaction-to-user";

interface SpendingChartSectionProps {
  txLoading: boolean;
  transactions: TransactionHistory[];
}

const SpendingChartSection = ({txLoading, transactions}: SpendingChartSectionProps) => {
  return (
    <div className="hidden rounded-2xl border border-border bg-card p-6 md:block">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Spending Trend</h3>

          <p className="text-sm text-muted-foreground">Last 30 days</p>
        </div>

        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Receipt className="h-5 w-5" />
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {txLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        ) : (
          <SpendingChart transactions={transactions} />
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 border-t border-border pt-4">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />

          <span className="text-sm text-muted-foreground">Income</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-violet-500" />

          <span className="text-sm text-muted-foreground">Expenses</span>
        </div>
      </div>
    </div>
  );
};

export default SpendingChartSection;
