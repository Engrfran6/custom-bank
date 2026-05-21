// components/dashboard/transaction-row.tsx
import {cn} from "@/lib/utils/utils";
import type {Transaction} from "@/types/database";
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
};

const typeColor: Record<string, string> = {
  internal_transfer: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  external_transfer: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  bill_payment: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  deposit: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  withdrawal: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  fee: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const statusBadge: Record<string, {label: string; icon: React.ReactNode; class: string}> = {
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

const isCredit = (t: Transaction, userId?: string) =>
  t.type === "deposit" || (t.type === "internal_transfer" && t.initiated_by !== userId);

interface TransactionRowProps {
  transaction: Transaction & {
    from_account?: {account_number: string; account_type: string} | null;
    to_account?: {account_number: string; account_type: string} | null;
  };
  userId?: string;
  onClick?: () => void; // Add onClick handler
}

export function TransactionRow({transaction: t, userId, onClick}: TransactionRowProps) {
  const credit = isCredit(t, userId);
  const status = statusBadge[t.status];

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: t.currency ?? "USD",
  }).format(Number(t.amount));

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(t.created_at));

  const label = t.description ?? t.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg px-2 -mx-2">
      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          typeColor[t.type],
        )}>
        {typeIcon[t.type]}
      </div>

      {/* Label + ref */}
      <div className="flex flex-1 flex-col min-w-0">
        <span className="truncate text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{t.reference}</span>
      </div>

      {/* Status */}
      <div className={cn("hidden items-center gap-1 text-xs font-medium sm:flex", status?.class)}>
        {status?.icon}
        {status?.label}
      </div>

      {/* Date */}
      <span className="hidden text-xs text-muted-foreground lg:block whitespace-nowrap">
        {date}
      </span>

      {/* Amount */}
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          credit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
        )}>
        {credit ? "+" : "-"}
        {amount}
      </span>
    </div>
  );
}

// import {TransactionHistory} from "@/lib/requests/fetch-transactions";
// import {cn} from "@/lib/utils/utils";
// import type {Transaction} from "@/types/database";
// import {
//   ArrowUpRight,
//   ArrowDownLeft,
//   Receipt,
//   RefreshCw,
//   Clock,
//   CheckCircle2,
//   XCircle,
// } from "lucide-react";

// const typeIcon: Record<string, React.ReactNode> = {
//   internal_transfer: <ArrowUpRight className="h-4 w-4" />,
//   external_transfer: <ArrowUpRight className="h-4 w-4" />,
//   credit: <ArrowDownLeft className="h-4 w-4" />,
//   debit: <ArrowUpRight className="h-4 w-4" />,
//   bill_payment: <Receipt className="h-4 w-4" />,
//   deposit: <ArrowDownLeft className="h-4 w-4" />,
//   withdrawal: <ArrowUpRight className="h-4 w-4" />,
//   fee: <RefreshCw className="h-4 w-4" />,
// };

// const typeColor: Record<string, string> = {
//   internal_transfer: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
//   external_transfer: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
//   credit: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
//   debit: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
//   bill_payment: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
//   deposit: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
//   withdrawal: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
//   fee: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
// };

// const statusBadge: Record<string, {label: string; icon: React.ReactNode; class: string}> = {
//   pending: {
//     label: "Pending",
//     icon: <Clock className="h-3 w-3" />,
//     class: "text-yellow-600 dark:text-yellow-400",
//   },
//   processing: {
//     label: "Processing",
//     icon: <RefreshCw className="h-3 w-3" />,
//     class: "text-blue-600 dark:text-blue-400",
//   },
//   completed: {
//     label: "Completed",
//     icon: <CheckCircle2 className="h-3 w-3" />,
//     class: "text-emerald-600 dark:text-emerald-400",
//   },
//   failed: {
//     label: "Failed",
//     icon: <XCircle className="h-3 w-3" />,
//     class: "text-red-600 dark:text-red-400",
//   },
//   reversed: {
//     label: "Reversed",
//     icon: <RefreshCw className="h-3 w-3" />,
//     class: "text-slate-600 dark:text-slate-400",
//   },
// };

// interface TransactionRowProps {
//   transaction: TransactionHistory;
//   onClick?: () => void;
// }

// export function TransactionRow({transaction: t, onClick}: TransactionRowProps) {
//   const isCredit = t.type === "credit";
//   const status = statusBadge[t?.transaction?.status];

//   const amount = new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: t.transaction.currency ?? "USD",
//   }).format(Number(t.transaction.amount));

//   const date = new Intl.DateTimeFormat("en-US", {
//     month: "short",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   }).format(new Date(t.created_at));

//   const label =
//     t.transaction.description ??
//     t.transaction.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

//   const type = t.transaction.type && t.type;

//   return (
//     <div
//       onClick={onClick}
//       className="flex items-center gap-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-lg px-2 -mx-2">
//       {/* Type icon */}
//       <div
//         className={cn(
//           "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
//           typeColor[type],
//         )}>
//         {typeIcon[type]}
//       </div>

//       {/* Label + reference */}
//       <div className="flex flex-1 flex-col min-w-0">
//         <span className="truncate text-sm font-medium">{label}</span>
//         <span className="text-xs text-muted-foreground">{t.transaction.reference}</span>
//       </div>

//       {/* Status */}
//       <div className={cn("hidden items-center gap-1 text-xs font-medium sm:flex", status?.class)}>
//         {status?.icon}
//         {status?.label}
//       </div>

//       {/* Date */}
//       <span className="hidden text-xs text-muted-foreground lg:block whitespace-nowrap">
//         {date}
//       </span>

//       {/* Amount — single, correct display */}
//       <span
//         className={cn(
//           "text-sm font-semibold tabular-nums",
//           isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400",
//         )}>
//         {isCredit ? "+" : "−"}
//         {amount}
//       </span>
//     </div>
//   );
// }
