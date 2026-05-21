import {Shield, TrendingDown, TrendingUp, Eye, EyeOff} from "lucide-react";
import Link from "next/link";
import {useState} from "react";
import {fmt} from "@/lib/helper";

interface MobileBalanceSectionProps {
  totalBalance: number;
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  stats: {
    totalIn: number;
    totalOut: number;
  };
}

const MobileBalanceSection = ({
  totalBalance,
  showBalance,
  setShowBalance,
  stats,
}: MobileBalanceSectionProps) => {
  return (
    <div className="md:hidden relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 shadow-lg">
      <div className="absolute top-0 right-0 opacity-10">
        <Shield className="h-24 w-24 text-white" />
      </div>
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="text-blue-100 text-sm">Total Balance</p>
            <button onClick={() => setShowBalance(!showBalance)} className="text-blue-100">
              {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-1 text-blue-100 text-sm font-mono font-medium underline underline-offset-4">
            View transactions
          </Link>
        </div>
        <p className="text-3xl font-bold text-white mb-2">
          {showBalance ? fmt(totalBalance) : "••••••"}
        </p>
        <div className="flex items-center gap-4 text-blue-100 text-xs">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            <span>+{fmt(stats.totalIn)}</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="h-3 w-3" />
            <span>-{fmt(stats.totalOut)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBalanceSection;
