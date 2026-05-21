// components/dashboard/sections/transactions-section.tsx
"use client";

import {useState} from "react";
import {TransactionRow} from "../transaction-row";
import {TransactionRowSkeleton} from "../skeleton";
import {TransactionDetailDialog} from "../transaction-detail-dialog";
import {Search, ChevronRight} from "lucide-react";
import Link from "next/link";
import type {Transaction} from "@/types/database";

interface Props {
  transactions: Transaction[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  profileId?: string;
}

export function TransactionsSection({
  transactions,
  loading,
  searchQuery,
  onSearchChange,
  profileId,
}: Props) {
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div className="col-span-3 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">Your latest activity</p>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="divide-y divide-border">
        {loading ? (
          Array.from({length: 5}).map((_, i) => <TransactionRowSkeleton key={i} />)
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="rounded-full bg-muted/30 p-4">
              <Search className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mt-4 text-sm font-medium">
              {searchQuery ? "No matching transactions" : "No transactions yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 8).map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onClick={() => {
                  setSelected(t);
                  setOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      <TransactionDetailDialog
        transaction={selected}
        open={open}
        onOpenChange={setOpen}
        userId={profileId}
      />

      <Link
        href="/dashboard/transactions"
        className="flex items-center justify-center gap-1 mt-4 pt-4 text-sm text-primary hover:underline">
        View All Transactions <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
