"use client";

import {useAdminStats} from "@/lib/hooks/use-admin-stats";
import {AdminStatsCards} from "@/components/admin/admin-stats-cards";
import {AdminChart} from "@/components/admin/admin-chart";
import {TransactionRowSkeleton} from "@/components/dashboard/skeleton";
import {ArrowLeftRight, BarChart3} from "lucide-react";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import {AdminTransactionRow} from "@/components/admin/admin-transaction-row";

export default function AdminPage() {
  const {stats, dailyChart, recentTx, loading} = useAdminStats();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Back Office</h1>
        <p className="text-sm text-muted-foreground">System-wide overview and controls</p>
      </div>

      {/* Stats */}
      <AdminStatsCards stats={stats} loading={loading} />

      {/* Chart + recent tx */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        {/* Daily chart */}
        <div className="rounded-xl border border-border bg-card p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Transaction Activity</h2>
              <p className="text-xs text-muted-foreground">Volume & count — last 14 days</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-56">
            {loading ? (
              <div className="h-full w-full animate-pulse rounded-lg bg-muted" />
            ) : (
              <AdminChart data={dailyChart} />
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-col gap-3 xl:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Actions
          </h2>
          {[
            {label: "Manage Users", href: "/admin/users", desc: "View, suspend, verify KYC"},
            {
              label: "Transaction Monitor",
              href: "#",
              desc: "Filter, flag, review all txns",
            },
            {label: "Ledger Explorer", href: "/admin/ledger", desc: "Double-entry audit trail"},
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4 hover:bg-muted transition-colors group">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Recent Transactions</h2>
            <p className="text-xs text-muted-foreground">Latest activity across all users</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/transactions">View all</Link>
          </Button>
        </div>
        <div className="divide-y divide-border">
          {loading ? (
            Array.from({length: 5}).map((_, i) => <TransactionRowSkeleton key={i} />)
          ) : recentTx?.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            recentTx?.slice(0, 5).map((t) => <AdminTransactionRow key={t.id} transaction={t} />)
          )}
        </div>
      </div>
    </div>
  );
}
