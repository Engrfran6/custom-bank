import {StatsCard} from "@/components/dashboard/stats-card";
import {Skeleton} from "@/components/dashboard/skeleton";
import {Users, ArrowLeftRight, TrendingUp, DollarSign, UserCheck, Landmark} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  totalDeposit: number;
  totalFees: number;
}

export function AdminStatsCards({stats, loading}: {stats: AdminStats | null; loading: boolean}) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({length: 6}).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Users",
      value: String(stats?.totalUsers ?? 0),
      icon: Users,
      iconClass: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "Active Users",
      value: String(stats?.activeUsers ?? 0),
      icon: UserCheck,
      iconClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      label: "Transactions",
      value: String(stats?.totalTransactions ?? 0),
      icon: ArrowLeftRight,
      iconClass: "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
    },
    {
      label: "Total Volume",
      value: fmt(stats?.totalVolume ?? 0),
      icon: TrendingUp,
      iconClass: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    },
    {
      label: "Total Deposits",
      value: fmt(stats?.totalDeposit ?? 0),
      icon: Landmark,
      iconClass: "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400",
    },
    {
      label: "Fees Collected",
      value: fmt(stats?.totalFees ?? 0),
      icon: DollarSign,
      iconClass: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((c) => (
        <StatsCard key={c.label} {...c} />
      ))}
    </div>
  );
}
