import {createClient} from "@/lib/supabase/client-with-offline";
import type {Transaction} from "@/types/database";

export interface UserStats {
  totalIn: number;
  totalOut: number;
  totalTransactions: number;
  averageTransaction: number;
  largestTransaction: number;
  savingsRate: number;
}

export interface DailyPoint {
  date: string;
  volume: number;
  count: number;
  income: number;
  expenses: number;
}

export interface UserStatsResult {
  stats: UserStats;
  dailyChart: DailyPoint[];
  recentTx: Transaction[];
}

export async function fetchUserStats(userId: string): Promise<UserStatsResult> {
  const supabase = createClient();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const {data: transactions, error} = await supabase
    .from("transactions")
    .select("*")
    .or(
      `initiated_by.eq.${userId},from_account.user_id.eq.${userId},to_account.user_id.eq.${userId}`,
    )
    .eq("status", "completed")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", {ascending: false});

  if (error) throw error;

  const txList = transactions ?? [];

  const deposits = txList.filter((t) => t.type === "deposit");
  const withdrawals = txList.filter((t) =>
    ["withdrawal", "external_transfer", "bill_payment"].includes(t.type),
  );

  const totalIn = deposits.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalOut = withdrawals.reduce((sum, t) => sum + Number(t.amount), 0);
  const totalTransactions = txList.length;
  const averageTransaction = totalTransactions > 0 ? (totalIn + totalOut) / totalTransactions : 0;
  const largestTransaction =
    txList.length > 0 ? Math.max(...txList.map((t) => Number(t.amount))) : 0;
  const savingsRate = totalIn > 0 ? ((totalIn - totalOut) / totalIn) * 100 : 0;

  // Build daily chart
  const dayMap: Record<string, DailyPoint> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toLocaleDateString("en-US", {month: "short", day: "numeric"});
    dayMap[key] = {date: key, volume: 0, count: 0, income: 0, expenses: 0};
  }

  txList.forEach((t) => {
    const key = new Date(t.created_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    if (dayMap[key]) {
      const amount = Number(t.amount);
      dayMap[key].volume += amount;
      dayMap[key].count += 1;
      if (t.type === "deposit") {
        dayMap[key].income += amount;
      } else {
        dayMap[key].expenses += amount;
      }
    }
  });

  return {
    stats: {
      totalIn,
      totalOut,
      totalTransactions,
      averageTransaction,
      largestTransaction,
      savingsRate,
    },
    dailyChart: Object.values(dayMap),
    recentTx: txList.slice(0, 5),
  };
}
