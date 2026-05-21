import {Receipt} from "lucide-react";
import {SpendingChart} from "../spending-chart";
import {Transaction} from "@/types/database";

interface TrxChartProps {
  txLoading: boolean;
  transactions: Transaction[];
}

const SpendingChartSection = ({txLoading, transactions}: TrxChartProps) => {
  return (
    <div className="hidden md:block rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Spending Trend</h3>
          <p className="text-sm text-muted-foreground">Last 30 days</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
          <Receipt className="h-5 w-5" />
        </div>
      </div>
      <div className="h-64">
        {txLoading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        ) : (
          <SpendingChart transactions={transactions} />
        )}
      </div>
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-border">
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
