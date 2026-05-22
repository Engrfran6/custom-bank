"use client";

import {useMemo, useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";

import {ChevronRight, Search} from "lucide-react";

import {TransactionRowSkeleton} from "@/components/dashboard/skeleton";
import {TransactionDetailDialog} from "@/components/dashboard/transaction-detail-dialog";
import {TransactionRow} from "@/components/dashboard/transaction-row";

import {useTransactions} from "@/lib/hooks/use-transactions";

import type {TransactionHistory} from "@/lib/mapper/db-transaction-to-user";

const TransactionHistoryComponent = () => {
  const pathname = usePathname();

  /**
   * useTransactions now returns TransactionHistory[]
   */
  const {transactions = [], loading: txLoading} = useTransactions(20);

  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Selected transaction is entry-based
   */
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionHistory | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);

  /**
   * Search nested transaction fields
   */
  const searchedTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return transactions;
    }

    const query = searchQuery.toLowerCase().trim();

    return transactions.filter((entry) => {
      const tx = entry.transaction;

      return (
        tx.description?.toLowerCase().includes(query) ||
        tx.status?.toLowerCase().includes(query) ||
        tx.type?.toLowerCase().includes(query) ||
        tx.reference?.toLowerCase().includes(query) ||
        String(entry.amount).includes(query)
      );
    });
  }, [transactions, searchQuery]);

  const handleTransactionClick = (transaction: TransactionHistory) => {
    setSelectedTransaction(transaction);
    setDialogOpen(true);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground">Recent Transactions</p>

            <p className="mt-0.5 text-xs text-muted-foreground">Your latest activity</p>
          </div>

          {!pathname.includes("transactions") && (
            <Link
              href="/dashboard/transfers"
              className="group/link flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary">
              <span>View all</span>

              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
            </Link>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />

          <input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="divide-y divide-border">
        {txLoading ? (
          Array.from({length: 5}).map((_, i) => <TransactionRowSkeleton key={i} />)
        ) : searchedTransactions.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="rounded-full bg-muted/30 p-4">
              <Search className="h-8 w-8 text-muted-foreground/40" />
            </div>

            <p className="mt-4 text-sm font-medium text-foreground">
              {searchQuery ? "No matching transactions" : "No transactions yet"}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search"
                : "Send money or pay a bill to get started"}
            </p>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {searchedTransactions.slice(0, 13).map((transaction, index) => (
              <TransactionRow
                key={`${transaction.id}-${transaction.type}-${index}`}
                transaction={transaction}
                onClick={() => handleTransactionClick(transaction)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Results Count */}
      {!txLoading && searchedTransactions.length > 0 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(13, searchedTransactions.length)} of {searchedTransactions.length}{" "}
            transactions
          </p>
        </div>
      )}

      {/* Dialog */}
      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
};

export default TransactionHistoryComponent;
