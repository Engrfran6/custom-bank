"use client";

import {useAccounts} from "@/lib/hooks/use-accounts";
import {Skeleton} from "@/components/dashboard/skeleton";
import {cn} from "@/lib/utils/utils";
import {Landmark, TrendingUp, Wallet, CheckCircle2, Snowflake, XCircle} from "lucide-react";

const accountIcons = {
  checking: Wallet,
  savings: Landmark,
  investment: TrendingUp,
};

const accountColors = {
  checking: "bg-blue-100   text-blue-600   dark:bg-blue-900/30   dark:text-blue-400",
  savings: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  investment: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
};

const statusConfig = {
  active: {icon: CheckCircle2, class: "text-emerald-600 dark:text-emerald-400", label: "Active"},
  frozen: {icon: Snowflake, class: "text-blue-600   dark:text-blue-400", label: "Frozen"},
  closed: {icon: XCircle, class: "text-red-500", label: "Closed"},
};

export function SettingsAccounts() {
  const {accounts, loading} = useAccounts();

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({length: 3}).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {accounts.map((account) => {
        const Icon = accountIcons[account.account_type as keyof typeof accountIcons] ?? Wallet;
        const colorClass = accountColors[account.account_type as keyof typeof accountColors] ?? "";
        const status = statusConfig[account.status as keyof typeof statusConfig];
        const StatusIcon = status?.icon;

        return (
          <div
            key={account.id}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className={cn("rounded-xl p-3", colorClass)}>
              <Icon className="h-5 w-5" />
            </div>

            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold capitalize">{account.account_type} Account</p>
                {status && (
                  <div className={cn("flex items-center gap-1 text-xs font-medium", status.class)}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </div>
                )}
              </div>
              <p className="font-mono text-xs text-muted-foreground">{account.account_number}</p>
              <p className="text-xs text-muted-foreground">
                {account.currency} · Opened{" "}
                {new Date(account.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold tabular-nums">{fmt(Number(account.balance))}</p>
              <p className="text-xs text-muted-foreground">Available</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
