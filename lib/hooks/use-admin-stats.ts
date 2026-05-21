"use client";

import {useQuery} from "@tanstack/react-query";
import type {Transaction} from "@/types/database";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalTransactions: number;
  totalVolume: number;
  totalDeposit: number;
  totalFees: number;
}

interface DailyPoint {
  date: string;
  volume: number;
  count: number;
}

interface AdminStatsResult {
  stats: AdminStats;
  dailyChart: DailyPoint[];
  recentTx: Transaction[];
}

async function fetchAdminStats(): Promise<AdminStatsResult> {
  const res = await fetch("/api/admin/stats");
  if (!res.ok) throw new Error("Failed to fetch admin stats");
  return res.json();
}

export function useAdminStats() {
  const {data, isLoading} = useQuery({
    queryKey: ["admin-stats"],
    queryFn: fetchAdminStats,
    staleTime: 60 * 1000, // admin stats — 1 min is fine
  });

  return {
    stats: data?.stats ?? null,
    dailyChart: data?.dailyChart ?? [],
    recentTx: data?.recentTx ?? [],
    loading: isLoading,
  };
}
