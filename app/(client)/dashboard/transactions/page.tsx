"use client";

import {TransactionRowSkeleton} from "@/components/dashboard/skeleton";
import {TransactionDetailDialog} from "@/components/dashboard/transaction-detail-dialog";
import {TransactionRow} from "@/components/dashboard/transaction-row";
import {useProfile} from "@/lib/hooks/use-profile";
import {useTransactions} from "@/lib/hooks/use-transactions";
import {Transaction} from "@/types/database";
import {ChevronRight, Search} from "lucide-react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useMemo, useState} from "react";

const TransactionHistory = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const {profile} = useProfile();

  const {transactions, loading: txLoading} = useTransactions(20);
  const pathname = usePathname();
  // State for search
  const [searchQuery, setSearchQuery] = useState("");

  // Filter transactions based on search query
  const searchedTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;

    const query = searchQuery.toLowerCase().trim();
    return transactions.filter(
      (t) =>
        t.description?.toLowerCase().includes(query) ||
        t.amount.toString().includes(query) ||
        t.status?.toLowerCase().includes(query) ||
        t.type?.toLowerCase().includes(query),
    );
  }, [transactions, searchQuery]);

  const handleTransactionClick = (transaction: Transaction) => {
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

        {/* Search input */}
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
            {searchedTransactions.slice(0, 13).map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                onClick={() => handleTransactionClick(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Show results count */}
      {!txLoading && searchedTransactions.length > 0 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-muted-foreground">
            Showing {Math.min(13, searchedTransactions.length)} of {searchedTransactions.length}{" "}
            transactions
          </p>
        </div>
      )}

      <TransactionDetailDialog
        transaction={selectedTransaction}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={profile?.id}
      />
    </div>
  );
};
export default TransactionHistory;

// "use client";

// import {TransactionRowSkeleton} from "@/components/dashboard/skeleton";
// import {TransactionDetailDialog} from "@/components/dashboard/transaction-detail-dialog";
// import {TransactionRow} from "@/components/dashboard/transaction-row";
// import {useProfile} from "@/lib/hooks/use-profile";
// import {useTransactions} from "@/lib/hooks/use-transactions";
// import {TransactionHistory} from "@/lib/requests/fetch-transactions";
// import {ChevronRight, Search} from "lucide-react";
// import Link from "next/link";
// import {usePathname} from "next/navigation";
// import {useMemo, useState} from "react";

// const TransactionHistoryPage = () => {
//   const [selectedTransaction, setSelectedTransaction] = useState<TransactionHistory | null>(null);
//   const [dialogOpen, setDialogOpen] = useState(false);
//   const {profile} = useProfile();

//   const {loading: txLoading, transactions} = useTransactions(20);
//   const pathname = usePathname();
//   // State for search
//   const [searchQuery, setSearchQuery] = useState("");

//   // Filter transactions based on search query
//   const searchedTransactions = useMemo(() => {
//     if (!searchQuery.trim()) return transactions;
//     const query = searchQuery.toLowerCase().trim();
//     return transactions.filter(
//       (t) =>
//         t.transaction.description?.toLowerCase().includes(query) ||
//         t.transaction.amount.toString().includes(query) ||
//         t.transaction.status?.toLowerCase().includes(query) ||
//         t.type?.toLowerCase().includes(query),
//     );
//   }, [transactions, searchQuery]);

//   const handleTransactionClick = (transaction: TransactionHistory) => {
//     setSelectedTransaction(transaction);
//     setDialogOpen(true);
//   };

//   return (
//     <div className="rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5">
//       <div className="mb-4 space-y-3">
//         <div className="flex flex-wrap items-center justify-between gap-2">
//           <div>
//             <p className="text-sm font-semibold text-foreground">Recent Transactions</p>
//             <p className="mt-0.5 text-xs text-muted-foreground">Your latest activity</p>
//           </div>
//           {!pathname.includes("transactions") && (
//             <Link
//               href="/dashboard/transfers"
//               className="group/link flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary">
//               <span>View all</span>
//               <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover/link:translate-x-0.5" />
//             </Link>
//           )}
//         </div>

//         {/* Search input */}
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
//           <input
//             type="text"
//             placeholder="Search transactions..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20"
//           />
//         </div>
//       </div>

//       <div className="divide-y divide-border">
//         {txLoading ? (
//           Array.from({length: 5}).map((_, i) => <TransactionRowSkeleton key={i} />)
//         ) : searchedTransactions.length === 0 ? (
//           <div className="flex flex-col items-center py-12 text-center">
//             <div className="rounded-full bg-muted/30 p-4">
//               <Search className="h-8 w-8 text-muted-foreground/40" />
//             </div>
//             <p className="mt-4 text-sm font-medium text-foreground">
//               {searchQuery ? "No matching transactions" : "No transactions yet"}
//             </p>
//             <p className="mt-1 text-xs text-muted-foreground">
//               {searchQuery
//                 ? "Try adjusting your search"
//                 : "Send money or pay a bill to get started"}
//             </p>
//             {searchQuery && (
//               <button
//                 onClick={() => setSearchQuery("")}
//                 className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20">
//                 Clear search
//               </button>
//             )}
//           </div>
//         ) : (
//           <div className="space-y-1">
//             {searchedTransactions.slice(0, 13).map((t) => (
//               <TransactionRow
//                 key={t.id}
//                 transaction={t}
//                 onClick={() => handleTransactionClick(t)}
//               />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Show results count */}
//       {!txLoading && searchedTransactions.length > 0 && (
//         <div className="mt-3 text-center">
//           <p className="text-xs text-muted-foreground">
//             Showing {Math.min(13, searchedTransactions.length)} of {searchedTransactions.length}{" "}
//             transactions
//           </p>
//         </div>
//       )}

//       <TransactionDetailDialog
//         transaction={selectedTransaction}
//         open={dialogOpen}
//         onOpenChange={setDialogOpen}
//         userId={profile?.id}
//       />
//     </div>
//   );
// };
// export default TransactionHistoryPage;
