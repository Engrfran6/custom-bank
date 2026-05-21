"use client";

import {cn} from "@/lib/utils/utils";
import type {Account, Transaction} from "@/types/database";
import {Eye, EyeOff, ArrowUpRight, ArrowDownLeft, MoreVertical, Copy, Check} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {AccountDetailsDialog} from "./account-details-dailog";
import {TransferDialog} from "./transfer-dialog";
import {ReceiveDialog} from "./receive-dialog";
import {useFraud} from "@/lib/context/fraud-context";
import {toast} from "sonner";

// Gradient configurations for different account types
const gradients: Record<string, {light: string; dark: string}> = {
  checking: {
    light: "from-blue-500 to-blue-700",
    dark: "from-blue-600 to-blue-900",
  },
  savings: {
    light: "from-emerald-500 to-emerald-700",
    dark: "from-emerald-600 to-emerald-900",
  },
  investment: {
    light: "from-violet-500 to-violet-700",
    dark: "from-violet-600 to-violet-900",
  },
  credit: {
    light: "from-rose-500 to-rose-700",
    dark: "from-rose-600 to-rose-900",
  },
  default: {
    light: "from-slate-500 to-slate-700",
    dark: "from-slate-600 to-slate-900",
  },
};

const labels: Record<string, string> = {
  checking: "Checking Account",
  savings: "Savings Account",
  investment: "Investment Account",
  credit: "Credit Card",
};

interface AccountCardProps {
  account: Account;
  onSend?: () => void;
  onReceive?: () => void;
  onCopyNumber?: () => void;
  showActions?: boolean;
  className?: string;
  transactions?: Transaction[];
}

export function AccountCard({
  account,
  onSend,
  onReceive,
  onCopyNumber,
  showActions = true,
  className,
  transactions = [],
}: AccountCardProps) {
  const [hidden, setHidden] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const {guardAction} = useFraud();
  const router = useRouter();

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: account.currency ?? "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(account.balance));

  const masked = "••••••••";

  // Get gradient based on account type and theme
  const gradient = gradients[account.account_type] ?? gradients.default;

  // Format account number with masking
  const formatAccountNumber = (number: string) => {
    if (number.length <= 8) return number;
    return `•••• ${number.slice(-4)}`;
  };

  const handleCopyNumber = async () => {
    if (onCopyNumber) {
      onCopyNumber();
    } else {
      await navigator.clipboard.writeText(account.account_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleViewDetails = () => {
    setShowMenu(false);
    setDetailsOpen(true);
  };

  const handleDownloadStatement = () => {
    setShowMenu(false);
    setDetailsOpen(true);
  };

  const handleSend = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (account.balance <= 0) {
      toast.warning("Your balance is too low to send money.");

      return;
    }

    guardAction(() => {
      if (onSend) onSend();
      else setTransferOpen(true);
    }, "send money");
  };

  const handleReceive = (e: React.MouseEvent) => {
    e.stopPropagation();
    guardAction(() => {
      if (onReceive) onReceive();
      else setReceiveOpen(true);
    }, "receive money");
  };

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg transition-all duration-300 cursor-pointer",
          "hover:shadow-xl",
          // Responsive padding - smaller on mobile
          "p-3 sm:p-4 md:p-5",
          // Hover scale only on desktop to avoid interference with touch
          "md:hover:scale-[1.02]",
          gradient.light,
          "dark:" + gradient.dark,
          className,
        )}
        onClick={() => setDetailsOpen(true)}>
        {/* Animated background decorations - hidden on mobile for performance */}
        <div className="pointer-events-none absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 transition-all duration-500 md:group-hover:scale-150 md:group-hover:bg-white/15 hidden sm:block" />
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/5 transition-all duration-500 md:group-hover:scale-150 hidden sm:block" />
        <div className="pointer-events-none absolute -left-8 -top-8 h-24 w-24 rounded-full bg-white/5 transition-all duration-500 md:group-hover:scale-150 hidden sm:block" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Account type label - smaller on mobile */}
              <p
                className={cn(
                  "font-semibold uppercase tracking-wider text-white/80",
                  "text-[10px] sm:text-xs",
                )}>
                {labels[account.account_type] || account.account_type}
              </p>

              {/* Account number row - more compact on mobile */}
              <div className={cn("flex items-center gap-1.5 sm:gap-2", "mt-0.5 sm:mt-1")}>
                <p className={cn("font-mono text-white/60", "text-[10px] sm:text-xs")}>
                  {formatAccountNumber(account.account_number)}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyNumber();
                  }}
                  className="rounded p-0.5 text-white/40 transition-all hover:bg-white/10 hover:text-white/80">
                  {copied ? (
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  )}
                </button>
              </div>
            </div>

            <div
              className="flex items-center gap-0.5 sm:gap-1"
              onClick={(e) => e.stopPropagation()}>
              {/* Eye button - smaller on mobile */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setHidden(!hidden);
                }}
                className={cn(
                  "rounded-full text-white/60 transition-all hover:bg-white/10 hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30",
                  "p-1 sm:p-1.5",
                )}>
                {hidden ? (
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                )}
              </button>

              {/* More options menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className={cn(
                    "rounded-full text-white/60 transition-all hover:bg-white/10 hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/30",
                    "p-1 sm:p-1.5",
                  )}>
                  <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-6 sm:top-8 z-30 min-w-[120px] sm:min-w-[140px] rounded-lg bg-white py-1 shadow-lg dark:bg-gray-800">
                      <button
                        onClick={handleViewDetails}
                        className="w-full px-2 py-1.5 sm:px-3 text-left text-[11px] sm:text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                        View Details
                      </button>
                      <button
                        onClick={handleDownloadStatement}
                        className="w-full px-2 py-1.5 sm:px-3 text-left text-[11px] sm:text-xs text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                        Download Statement
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          router.push("/dashboard/report");
                        }}
                        className="w-full px-2 py-1.5 sm:px-3 text-left text-[11px] sm:text-xs text-red-600 transition-colors hover:bg-gray-100 dark:text-red-400 dark:hover:bg-gray-700">
                        Report Issue
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Balance - more compact on mobile */}
          <div className={cn("mt-3 sm:mt-4 md:mt-5")}>
            <p className={cn("font-medium text-white/60", "text-[10px] sm:text-xs")}>
              Available Balance
            </p>

            <div className="flex justify-between items-center">
              <div className={cn("flex items-baseline gap-1.5 sm:gap-2", "mt-0.5 sm:mt-1")}>
                <p
                  className={cn(
                    "font-bold tracking-tight text-white",
                    "text-xl sm:text-2xl md:text-3xl",
                  )}>
                  {hidden ? masked : formatted}
                </p>
                {account.currency && !hidden && (
                  <span className={cn("font-medium text-white/50", "text-[10px] sm:text-xs")}>
                    {account.currency}
                  </span>
                )}
              </div>

              {/* Actions - stacked on mobile, row on desktop */}
              {showActions && (
                <div className={cn("relative z-20 flex gap-2", "mt-3 sm:mt-4 md:mt-5")}>
                  <button
                    type="button"
                    onClick={handleSend}
                    className={cn(
                      "flex items-center gap-1 rounded-lg bg-white/20 font-medium text-white backdrop-blur-sm transition-all active:scale-95",
                      "hover:bg-white/30 md:hover:scale-105",
                      "px-2 py-1 sm:px-2.5 sm:py-0.5 md:px-3 md:py-0.5",
                      "text-[10px] sm:text-xs",
                    )}>
                    <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Send
                  </button>

                  <button
                    type="button"
                    onClick={handleReceive}
                    className={cn(
                      "flex items-center gap-1 rounded-lg bg-white/20 font-medium text-white backdrop-blur-sm transition-all active:scale-95",
                      "hover:bg-white/30 md:hover:scale-105",
                      "px-2 py-1 sm:px-2.5 sm:py-1.5 md:px-3 md:py-1.5",
                      "text-[10px] sm:text-xs",
                    )}>
                    <ArrowDownLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    Receive
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer gradient overlay - hidden on mobile */}
          <div className="absolute bottom-0 left-0 right-0 h-12 sm:h-16 md:h-20 bg-gradient-to-t from-black/20 to-transparent opacity-0 transition-opacity md:group-hover:opacity-100 hidden sm:block" />
        </div>
      </div>

      {/* Account Details Dialog */}
      <AccountDetailsDialog
        account={account}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        transactions={transactions}
      />

      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        fromAccountId={account.id}
        onSuccess={() => {
          // Refresh data or show success notification
          console.log("Transfer completed successfully");
        }}
      />

      {/* Receive Dialog */}
      <ReceiveDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        accountId={account.id}
        accountNumber={account.account_number}
        onSuccess={() => {
          console.log("Deposit completed");
        }}
      />
    </>
  );
}
