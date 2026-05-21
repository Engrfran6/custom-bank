import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Download, Eye, EyeOff, Filter, TrendingDown, TrendingUp} from "lucide-react";
import {fmt} from "@/lib/helper";
import {Account} from "@/types/database";

interface DesktopBalanceSectionProps {
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  totalBalance: number;
  accounts: Account[];
  stats: {
    totalIn: number;
    totalOut: number;
  };
}

const DesktopBalanceSection = ({
  showBalance,
  setShowBalance,
  totalBalance,
  accounts,
  stats,
}: DesktopBalanceSectionProps) => {
  return (
    <div className="hidden md:block rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col justify-center items-center lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-start gap-4">
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="mt-1 rounded-lg p-2 hover:bg-muted/50 transition-colors">
            {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <div>
            <p className="text-sm text-muted-foreground">Total Balance</p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-mono font-bold tracking-tight">
              {showBalance ? fmt(totalBalance) : "••••••"}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="outline" className="text-xs">
                All Accounts
              </Badge>
              <span className="text-xs text-muted-foreground">
                {accounts.length} {accounts.length === 1 ? "Account" : "Accounts"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-8 md:gap-12">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-xs font-medium text-muted-foreground">Money In</p>
            </div>
            <p className="font-mono text-xl md:text-2xl font-semibold text-emerald-600 dark:text-emerald-500">
              {fmt(stats.totalIn)}
            </p>
            <p className="text-xs text-emerald-600/70">This month</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
              <p className="text-xs font-medium text-muted-foreground">Money Out</p>
            </div>
            <p className="font-mono text-xl md:text-2xl font-semibold text-rose-600 dark:text-rose-500">
              {fmt(stats.totalOut)}
            </p>
            <p className="text-xs text-rose-600/70">This month</p>
          </div>
          <div className="hidden md:block w-px bg-border" />
          <div className="hidden md:flex items-center gap-3">
            <Button size="sm" variant="ghost" className="gap-2">
              <Download className="h-3.5 w-3.5" /> Export
            </Button>
            <Button size="sm" variant="ghost" className="gap-2">
              <Filter className="h-3.5 w-3.5" /> Filter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesktopBalanceSection;
