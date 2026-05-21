"use client";

import {cn} from "@/lib/utils/utils";
import type {LedgerEntry} from "@/lib/hooks/use-ledger";
import {TransactionRowSkeleton} from "@/components/dashboard/skeleton";
import {ArrowDownLeft, ArrowUpRight, ExternalLink} from "lucide-react";

interface LedgerTableProps {
  entries: LedgerEntry[];
  loading: boolean;
  onDrilldown: (txId: string) => void;
}

const accountTypeColors: Record<string, string> = {
  checking: "bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400",
  savings: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  investment: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  system_reserve: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  system_fees: "bg-slate-100  text-slate-700  dark:bg-slate-800     dark:text-slate-400",
};

export function LedgerTable({entries, loading, onDrilldown}: LedgerTableProps) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({length: 8}).map((_, i) => (
          <TransactionRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No entries found for the selected filters
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Header */}
      <div className="mb-1 grid min-w-[700px] grid-cols-12 gap-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Reference</div>
        <div className="col-span-3">Account</div>
        <div className="col-span-2">Type</div>
        <div className="col-span-1 text-right">Amount</div>
        <div className="col-span-1 text-right">Balance After</div>
        <div className="col-span-1 text-right">Details</div>
      </div>

      <div className="divide-y divide-border">
        {entries.map((entry) => {
          const isDebit = entry.type === "debit";
          const acctColor = accountTypeColors[entry.account?.account_type ?? ""] ?? "";
          const isSystem = ["system_reserve", "system_fees"].includes(
            entry.account?.account_type ?? "",
          );

          return (
            <div
              key={entry.id}
              className="grid min-w-[700px] grid-cols-12 items-center gap-3 px-3 py-3 hover:bg-muted/30 rounded-lg transition-colors">
              {/* Date */}
              <div className="col-span-2">
                <p className="text-xs font-medium">
                  {new Date(entry.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(entry.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Reference */}
              <div className="col-span-2 min-w-0">
                <p className="truncate font-mono text-xs font-medium">
                  {entry.transaction?.reference ?? "—"}
                </p>
                <p className="truncate text-[10px] capitalize text-muted-foreground">
                  {entry.transaction?.type?.replace(/_/g, " ")}
                </p>
              </div>

              {/* Account */}
              <div className="col-span-3 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize",
                      acctColor,
                    )}>
                    {entry.account?.account_type?.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                  {entry.account?.account_number}
                </p>
                {!isSystem && entry.account?.profiles && (
                  <p className="truncate text-[10px] text-muted-foreground">
                    {entry.account.profiles.full_name ?? entry.account.profiles.email}
                  </p>
                )}
              </div>

              {/* Entry type */}
              <div className="col-span-2">
                <div
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                    isDebit
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  )}>
                  {isDebit ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownLeft className="h-3 w-3" />
                  )}
                  {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                </div>
              </div>

              {/* Amount */}
              <div
                className={cn(
                  "col-span-1 text-right text-sm font-bold tabular-nums",
                  isDebit
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400",
                )}>
                {isDebit ? "-" : "+"}
                {fmt(Number(entry.amount))}
              </div>

              {/* Balance after */}
              <div className="col-span-1 text-right text-xs font-medium tabular-nums text-muted-foreground">
                {entry.balance_after != null ? fmt(Number(entry.balance_after)) : "—"}
              </div>

              {/* Drilldown */}
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() => onDrilldown(entry.transaction_id)}
                  className="rounded p-1.5 hover:bg-muted transition-colors"
                  title="View full transaction">
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
