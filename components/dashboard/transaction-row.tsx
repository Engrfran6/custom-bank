"use client";

import {cn} from "@/lib/utils/utils";
import type {TransactionHistory} from "@/lib/mapper/db-transaction-to-user";

import {
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const typeIcon: Record<string, React.ReactNode> = {
  internal_transfer: <ArrowUpRight className="h-4 w-4" />,
  external_transfer: <ArrowUpRight className="h-4 w-4" />,
  bill_payment: <Receipt className="h-4 w-4" />,
  deposit: <ArrowDownLeft className="h-4 w-4" />,
  withdrawal: <ArrowUpRight className="h-4 w-4" />,
  fee: <RefreshCw className="h-4 w-4" />,

  // entry types
  credit: <ArrowDownLeft className="h-4 w-4" />,
  debit: <ArrowUpRight className="h-4 w-4" />,
};

const typeColor: Record<string, string> = {
  internal_transfer: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",

  external_transfer: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",

  bill_payment: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",

  deposit: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",

  withdrawal: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",

  fee: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",

  // entry types
  credit: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",

  debit: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const statusBadge: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    class: string;
  }
> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-3 w-3" />,
    class: "text-yellow-600 dark:text-yellow-400",
  },

  processing: {
    label: "Processing",
    icon: <RefreshCw className="h-3 w-3" />,
    class: "text-blue-600 dark:text-blue-400",
  },

  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3 w-3" />,
    class: "text-emerald-600 dark:text-emerald-400",
  },

  failed: {
    label: "Failed",
    icon: <XCircle className="h-3 w-3" />,
    class: "text-red-600 dark:text-red-400",
  },

  reversed: {
    label: "Reversed",
    icon: <RefreshCw className="h-3 w-3" />,
    class: "text-slate-600 dark:text-slate-400",
  },
};

interface TransactionRowProps {
  transaction: TransactionHistory;
  onClick?: () => void;
}

export function TransactionRow({transaction: entry, onClick}: TransactionRowProps) {
  const tx = entry.transaction;

  const isCredit = entry.type === "credit";

  const status = statusBadge[tx.status];

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: tx.currency ?? "USD",
  }).format(Number(entry.amount));

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(entry.created_at));

  const label =
    tx.description || tx.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  /**
   * Use entry.type for UI direction
   * because TransactionHistory is ledger-entry based
   */
  const visualType = entry.type;

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-4 rounded-lg px-2 py-3 transition-colors hover:bg-muted/30 -mx-2">
      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          typeColor[visualType],
        )}>
        {typeIcon[visualType]}
      </div>

      {/* Label + Reference */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{label}</span>

        <span className="text-xs text-muted-foreground">{tx.reference}</span>
      </div>

      {/* Status */}
      <div className={cn("hidden items-center gap-1 text-xs font-medium sm:flex", status?.class)}>
        {status?.icon}
        {status?.label}
      </div>

      {/* Date */}
      <span className="hidden whitespace-nowrap text-xs text-muted-foreground lg:block">
        {date}
      </span>

      {/* Amount */}
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
        )}>
        {isCredit ? "+" : "-"}
        {amount}
      </span>
    </div>
  );
}
