// components/dashboard/bill-history.tsx
"use client";

import {useBillHistory} from "@/lib/hooks/use-bills";
import {TransactionRowSkeleton} from "./skeleton";
import {cn} from "@/lib/utils/utils";
import {CheckCircle2, Clock, XCircle, RefreshCw, Receipt} from "lucide-react";
import {BillPayment} from "@/types/database";

const statusMap = {
  completed: {label: "Paid", icon: CheckCircle2, class: "text-emerald-600 dark:text-emerald-400"},
  pending: {label: "Scheduled", icon: Clock, class: "text-yellow-600 dark:text-yellow-400"},
  failed: {label: "Failed", icon: XCircle, class: "text-red-500"},
  processing: {label: "Processing", icon: RefreshCw, class: "text-blue-500"},
} as const;

interface BillHistoryProps {
  onBillClick?: (bill: BillPayment) => void;
}

export function BillHistory({onBillClick}: BillHistoryProps) {
  const {bills, loading} = useBillHistory();

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({length: 5}).map((_, i) => (
          <TransactionRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Receipt className="h-8 w-8 text-muted-foreground/40" />
        <p className="mt-2 text-sm text-muted-foreground">No bill payments yet</p>
        <p className="text-xs text-muted-foreground">
          Pay a utility or service bill to see history here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {bills.slice(0, 4).map((bill) => {
        const status = statusMap[bill.status as keyof typeof statusMap] ?? statusMap.pending;
        const StatusIcon = status.icon;

        return (
          <div
            key={bill.id}
            onClick={() => onBillClick?.(bill)}
            className="flex items-center gap-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg px-2 -mx-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Receipt className="h-4 w-4" />
            </div>

            <div className="flex flex-1 flex-col min-w-0">
              <span className="truncate text-sm font-medium">{bill.biller_name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {bill.biller_type} · Ref: {bill.account_ref}
              </span>
            </div>

            {bill.is_recurring && (
              <div className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                <RefreshCw className="h-3 w-3" />
                Recurring
              </div>
            )}

            {bill.scheduled_at && bill.status === "pending" && (
              <span className="hidden text-xs text-muted-foreground lg:block whitespace-nowrap">
                {new Date(bill.scheduled_at).toLocaleDateString("en-US", {dateStyle: "medium"})}
              </span>
            )}

            <div
              className={cn("hidden items-center gap-1 text-xs font-medium sm:flex", status.class)}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </div>

            <span className="text-sm font-semibold tabular-nums">-{fmt(Number(bill.amount))}</span>
          </div>
        );
      })}
    </div>
  );
}
