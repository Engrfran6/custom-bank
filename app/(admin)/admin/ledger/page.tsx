"use client";

import {useState} from "react";
import {useLedger} from "@/lib/hooks/use-ledger";
import {LedgerSummaryBar} from "@/components/admin/ledger-summary-bar";
import {LedgerTable} from "@/components/admin/ledger-table";
import {TransactionDrilldown} from "@/components/admin/transaction-drilldown";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {ChevronLeft, ChevronRight, Landmark, X} from "lucide-react";
import {Skeleton} from "@/components/dashboard/skeleton";
import {Profile} from "@/types/database";

export default function LedgerPage() {
  const [accountId, setAccountId] = useState("");
  const [type, setType] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [drillTxId, setDrillTxId] = useState<string | null>(null);

  const {entries, accounts, summary, total, loading} = useLedger({
    account_id: accountId || undefined,
    type,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    pageSize: 25,
  });

  const totalPages = Math.ceil(total / 25);

  const clearFilters = () => {
    setAccountId("");
    setType("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const hasFilters = accountId || type !== "all" || dateFrom || dateTo;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ledger Explorer</h1>
          <p className="text-sm text-muted-foreground">
            Double-entry audit trail · {total.toLocaleString()} entries
          </p>
        </div>
        <Landmark className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Summary bar */}
      {loading && !summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({length: 4}).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : summary ? (
        <LedgerSummaryBar summary={summary} totalEntries={total} />
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Account filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Account</label>
          <Select
            value={accountId || "all"}
            onValueChange={(v) => {
              setAccountId(v === "all" ? "" : v);
              setPage(1);
            }}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Accounts</SelectItem>
              {accounts.map((a) => {
                const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
                return (
                  <SelectItem key={a.id} value={a.id}>
                    <div className="flex flex-col">
                      <span className="capitalize text-xs font-medium">
                        {a.account_type.replace("_", " ")} · {a.account_number}
                      </span>
                      {profile && (
                        <span className="text-[10px] text-muted-foreground">
                          {(profile as Profile).full_name ?? (profile as Profile).email}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Entry type */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Entry Type</label>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="debit">Debit</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <Input
            type="date"
            className="w-36"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <Input
            type="date"
            className="w-36"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Clear filters */}
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="self-end text-muted-foreground">
            <X className="mr-1.5 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Ledger table */}
      <div className="rounded-xl border border-border bg-card p-5">
        <LedgerTable entries={entries} loading={loading} onDrilldown={setDrillTxId} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Page {page} of {totalPages} · {total.toLocaleString()} entries
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drilldown modal */}
      <TransactionDrilldown txId={drillTxId} onClose={() => setDrillTxId(null)} />
    </div>
  );
}
