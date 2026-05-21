"use client";

import {Dialog, DialogContent, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Entries, LedgerEntry, useTransactionDrilldown} from "@/lib/hooks/use-ledger";
import {cn} from "@/lib/utils/utils";
import {CheckCircle2, AlertTriangle, ArrowUpRight, ArrowDownLeft, Loader2} from "lucide-react";

const statusColors: Record<string, string> = {
  completed: "text-emerald-600 dark:text-emerald-400",
  pending: "text-yellow-600  dark:text-yellow-400",
  processing: "text-blue-600   dark:text-blue-400",
  failed: "text-red-500",
  reversed: "text-slate-500",
};

interface TransactionDrilldownProps {
  txId: string | null;
  onClose: () => void;
}

export function TransactionDrilldown({txId, onClose}: TransactionDrilldownProps) {
  const {data, loading, error} = useTransactionDrilldown(txId);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

  return (
    <Dialog open={!!txId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transaction Detail
            {data && (
              <span className="font-mono text-sm text-muted-foreground">
                {data.transaction.reference}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && <div className="py-8 text-center text-sm text-red-500">{error}</div>}

        {data && !loading && (
          <div className="flex flex-col gap-5">
            {/* Balance check banner */}
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3",
                data.audit.isBalanced
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/20"
                  : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20",
              )}>
              {data.audit.isBalanced ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
              )}
              <div className="flex-1 text-sm">
                <span className="font-semibold">
                  {data.audit.isBalanced ? "Entries balanced" : "WARNING: Entries not balanced!"}
                </span>
                <span className="ml-2 text-muted-foreground">
                  Debits {fmt(data.audit.debitTotal)} · Credits {fmt(data.audit.creditTotal)} ·
                  {data.audit.entryCount} entries
                </span>
              </div>
            </div>

            {/* Transaction metadata */}
            <div className="rounded-xl border border-border bg-muted/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transaction Info
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                {[
                  ["Reference", data.transaction.reference],
                  ["Type", data.transaction.type?.replace(/_/g, " ")],
                  ["Status", data.transaction.status],
                  ["Amount", fmt(Number(data.transaction.amount))],
                  ["Fee", fmt(Number(data.transaction.fee ?? 0))],
                  [
                    "Total",
                    fmt(Number(data.transaction.amount) + Number(data.transaction.fee ?? 0)),
                  ],
                  [
                    "Initiated By",
                    data.transaction.initiator?.full_name ??
                      data.transaction.initiator?.email ??
                      "—",
                  ],
                  ["Description", data.transaction.description ?? "—"],
                  [
                    "Date",
                    new Date(data.transaction.created_at).toLocaleString("en-US", {
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
                        label === "Status" && statusColors[value as string],
                      )}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Double-entry table */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ledger Entries
              </p>
              <div className="overflow-hidden rounded-xl border border-border">
                {/* Table header */}
                <div className="grid grid-cols-12 gap-3 border-b border-border bg-muted/50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <div className="col-span-3">Account</div>
                  <div className="col-span-3">Owner</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2 text-right">Amount</div>
                  <div className="col-span-2 text-right">Balance After</div>
                </div>

                {/* Entries */}
                {(data.transaction.entries ?? []).map((entry: Entries, idx: number) => {
                  const isDebit = entry.type === "debit";
                  const profile = Array.isArray(entry.account?.profiles)
                    ? entry.account.profiles[0]
                    : entry.account?.profiles;

                  return (
                    <div
                      key={entry.id}
                      className={cn(
                        "grid grid-cols-12 items-center gap-3 px-4 py-3 text-sm",
                        idx % 2 === 0 ? "bg-background" : "bg-muted/20",
                      )}>
                      {/* Account */}
                      <div className="col-span-3 min-w-0">
                        <p className="truncate font-mono text-xs">
                          {entry.account?.account_number}
                        </p>
                        <p className="truncate text-[10px] capitalize text-muted-foreground">
                          {entry.account?.account_type?.replace("_", " ")}
                        </p>
                      </div>

                      {/* Owner */}
                      <div className="col-span-3 min-w-0">
                        <p className="truncate text-xs">
                          {profile?.full_name ?? profile?.email ?? "System"}
                        </p>
                      </div>

                      {/* Type badge */}
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
                          {entry.type}
                        </div>
                      </div>

                      {/* Amount */}
                      <div
                        className={cn(
                          "col-span-2 text-right font-bold tabular-nums",
                          isDebit
                            ? "text-red-600 dark:text-red-400"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}>
                        {isDebit ? "-" : "+"}
                        {fmt(Number(entry.amount))}
                      </div>

                      {/* Balance after */}
                      <div className="col-span-2 text-right text-xs font-medium tabular-nums text-muted-foreground">
                        {entry.balance_after != null ? fmt(Number(entry.balance_after)) : "—"}
                      </div>
                    </div>
                  );
                })}

                {/* Totals footer */}
                <div className="grid grid-cols-12 gap-3 border-t border-border bg-muted/60 px-4 py-2.5 text-xs font-bold">
                  <div className="col-span-8 text-muted-foreground uppercase tracking-wider">
                    Totals
                  </div>
                  <div className="col-span-2 text-right text-red-600 dark:text-red-400">
                    -{fmt(data.audit.debitTotal)}
                  </div>
                  <div className="col-span-2 text-right text-emerald-600 dark:text-emerald-400">
                    +{fmt(data.audit.creditTotal)}
                  </div>
                </div>
              </div>
            </div>

            {/* From / To accounts */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {label: "From Account", account: data.transaction.from_account},
                {label: "To Account", account: data.transaction.to_account},
              ].map(({label, account}) => (
                <div key={label} className="rounded-xl border border-border bg-muted/40 p-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  <p className="font-mono text-xs font-medium">{account?.account_number ?? "—"}</p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {account?.account_type?.replace("_", " ")}
                  </p>
                  <p className="mt-1 text-xs font-semibold">
                    Current: {fmt(Number(account?.balance ?? 0))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
