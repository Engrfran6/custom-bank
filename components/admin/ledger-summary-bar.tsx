import {cn} from "@/lib/utils/utils";
import {CheckCircle2, AlertTriangle, TrendingUp, TrendingDown} from "lucide-react";
import type {LedgerSummary} from "@/lib/hooks/use-ledger";

export function LedgerSummaryBar({
  summary,
  totalEntries,
}: {
  summary: LedgerSummary;
  totalEntries: number;
}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(n);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Balance status */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border p-4",
          summary.balanced
            ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/20"
            : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20",
        )}>
        {summary.balanced ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
        )}
        <div>
          <p className="text-xs text-muted-foreground">Ledger Balance</p>
          <p
            className={cn(
              "text-sm font-bold",
              summary.balanced ? "text-emerald-700 dark:text-emerald-400" : "text-red-600",
            )}>
            {summary.balanced ? "Balanced ✓" : "Imbalanced!"}
          </p>
        </div>
      </div>

      {/* Total debits */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="rounded-lg bg-red-100 p-2 dark:bg-red-900/30">
          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Debits</p>
          <p className="text-sm font-bold">{fmt(summary.totalDebits)}</p>
        </div>
      </div>

      {/* Total credits */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
          <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Credits</p>
          <p className="text-sm font-bold">{fmt(summary.totalCredits)}</p>
        </div>
      </div>

      {/* Entry count */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
        <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">#</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total Entries</p>
          <p className="text-sm font-bold">{totalEntries.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
