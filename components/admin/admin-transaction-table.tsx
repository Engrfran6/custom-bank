"use client";

import {useState} from "react";
import type {AdminTransaction} from "@/lib/hooks/use-admin-transactions";
import {TransactionRowSkeleton} from "@/components/dashboard/skeleton";
import {Button} from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  AlertTriangle,
  Eye,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
} from "lucide-react";
import {cn} from "@/lib/utils/utils";

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    class: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  pending: {
    icon: Clock,
    class: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
  },
  processing: {
    icon: RefreshCw,
    class: "text-blue-600   dark:text-blue-400",
    bg: "bg-blue-100   dark:bg-blue-900/30",
  },
  failed: {icon: XCircle, class: "text-red-500", bg: "bg-red-100    dark:bg-red-900/20"},
  reversed: {icon: RefreshCw, class: "text-slate-500", bg: "bg-slate-100  dark:bg-slate-800"},
};

const typeIcon = {
  internal_transfer: <ArrowUpRight className="h-4 w-4" />,
  external_transfer: <ArrowUpRight className="h-4 w-4" />,
  bill_payment: <Receipt className="h-4 w-4" />,
  deposit: <ArrowDownLeft className="h-4 w-4" />,
  withdrawal: <ArrowUpRight className="h-4 w-4" />,
  fee: <RefreshCw className="h-4 w-4" />,
};

interface AdminTransactionTableProps {
  transactions: AdminTransaction[];
  loading: boolean;
  onUpdate: (id: string, status: string) => Promise<void>;
}

export function AdminTransactionTable({
  transactions,
  loading,
  onUpdate,
}: AdminTransactionTableProps) {
  const [actionId, setActionId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<AdminTransaction | null>(null);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

  const handle = async (id: string, status: string) => {
    setActionId(id);
    try {
      await onUpdate(id, status);
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="divide-y divide-border">
        {Array.from({length: 8}).map((_, i) => (
          <TransactionRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">No transactions found</div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-2 grid grid-cols-12 gap-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <div className="col-span-2">Date</div>
        <div className="col-span-2">Reference</div>
        <div className="col-span-2 hidden lg:block">Type</div>
        <div className="col-span-2 hidden xl:block">From → To</div>
        <div className="col-span-2 hidden sm:block">Initiated By</div>
        <div className="col-span-1 text-right">Amount</div>
        <div className="col-span-1 hidden sm:block">Status</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      <div className="divide-y divide-border">
        {transactions.map((tx) => {
          const status = statusConfig[tx.status as keyof typeof statusConfig];
          const StatusIcon = status?.icon;
          const isSuspicious = Number(tx.amount) > 5000;

          return (
            <div
              key={tx.id}
              className={cn(
                "grid grid-cols-12 items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted/40",
                isSuspicious && "border-l-2 border-yellow-500 pl-1.5",
              )}>
              {/* Date */}
              <div className="col-span-2">
                <p className="text-xs font-medium">
                  {new Date(tx.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(tx.created_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* Reference */}
              <div className="col-span-2 min-w-0">
                <p className="truncate font-mono text-xs font-medium">{tx.reference}</p>
                {isSuspicious && (
                  <div className="flex items-center gap-1 text-[10px] text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    High value
                  </div>
                )}
              </div>

              {/* Type */}
              <div className="col-span-2 hidden lg:flex items-center gap-1.5">
                <span className="text-muted-foreground">
                  {typeIcon[tx.type as keyof typeof typeIcon]}
                </span>
                <span className="text-xs capitalize">{tx.type.replace(/_/g, " ")}</span>
              </div>

              {/* From → To */}
              <div className="col-span-2 hidden xl:block min-w-0">
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  {tx.from_account?.account_number ?? "—"}
                </p>
                <p className="truncate font-mono text-[10px] text-muted-foreground">
                  → {tx.to_account?.account_number ?? "—"}
                </p>
              </div>

              {/* Initiated by */}
              <div className="col-span-2 hidden min-w-0 sm:block">
                <p className="truncate text-xs font-medium">{tx.initiator?.full_name ?? "—"}</p>
                <p className="truncate text-[10px] text-muted-foreground">{tx.initiator?.email}</p>
              </div>

              {/* Amount */}
              <div className="col-span-1 text-right">
                <p className="text-sm font-bold tabular-nums">{fmt(Number(tx.amount))}</p>
                {tx.fee > 0 && (
                  <p className="text-[10px] text-muted-foreground">+{fmt(Number(tx.fee))} fee</p>
                )}
              </div>

              {/* Status */}
              <div className="col-span-1 hidden sm:block">
                {status && (
                  <div
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                      status.bg,
                      status.class,
                    )}>
                    <StatusIcon className="h-2.5 w-2.5" />
                    <span className="capitalize">{tx.status}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="col-span-1 flex justify-end">
                {actionId === tx.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setDetailItem(tx)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {tx.status === "pending" && (
                        <>
                          <DropdownMenuItem
                            onClick={() => handle(tx.id, "completed")}
                            className="text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Mark Completed
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handle(tx.id, "failed")}
                            className="text-red-500">
                            <XCircle className="mr-2 h-4 w-4" />
                            Mark Failed
                          </DropdownMenuItem>
                        </>
                      )}

                      {tx.status === "completed" && (
                        <DropdownMenuItem
                          onClick={() => handle(tx.id, "reversed")}
                          className="text-slate-600">
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Reverse Transaction
                        </DropdownMenuItem>
                      )}

                      {tx.status === "failed" && (
                        <DropdownMenuItem
                          onClick={() => handle(tx.id, "pending")}
                          className="text-yellow-600">
                          <Clock className="mr-2 h-4 w-4" />
                          Reset to Pending
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail dialog */}
      <Dialog open={!!detailItem} onOpenChange={(v) => !v && setDetailItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-mono text-sm">{detailItem?.reference}</DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Type", detailItem.type?.replace(/_/g, " ")],
                  ["Status", detailItem.status],
                  ["Amount", fmt(Number(detailItem.amount))],
                  ["Fee", fmt(Number(detailItem.fee ?? 0))],
                  ["Total", fmt(Number(detailItem.amount) + Number(detailItem.fee ?? 0))],
                  ["Currency", detailItem.currency],
                  [
                    "Initiated By",
                    detailItem.initiator?.full_name ?? detailItem.initiator?.email ?? "—",
                  ],
                  ["Description", detailItem.description ?? "—"],
                  ["From Account", detailItem.from_account?.account_number ?? "—"],
                  ["To Account", detailItem.to_account?.account_number ?? "—"],
                  [
                    "Created",
                    new Date(detailItem.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }),
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {label}
                    </span>
                    <span
                      className={cn(
                        "font-medium capitalize",
                        label === "Status" &&
                          statusConfig[value as keyof typeof statusConfig]?.class,
                      )}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {Number(detailItem.amount) > 5000 && (
                <div className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  High-value transaction flagged for review
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
