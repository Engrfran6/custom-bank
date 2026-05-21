"use client";

import {useAccounts} from "@/lib/hooks/use-accounts";
import {useTransactions} from "@/lib/hooks/use-transactions";
import {useCards} from "@/lib/hooks/use-card";
import {useProfile} from "@/lib/hooks/use-profile";
import {useFraud} from "@/lib/context/fraud-context";
import {useCallback, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {toast} from "sonner";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

export function useDashboard() {
  const router = useRouter();
  const {accounts, loading: accountsLoading, totalBalance} = useAccounts();
  const {transactions, loading: txLoading} = useTransactions(30);
  const {cards, loading: cardLoading} = useCards();
  const {profile} = useProfile();
  const {guardAction} = useFraud();

  const [showBalance, setShowBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Derived: stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    const completed = transactions.filter((t) => t.status === "completed");
    const totalIn = completed
      .filter((t) => t.type === "deposit")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalOut = completed
      .filter((t) => ["withdrawal", "external_transfer", "bill_payment"].includes(t.type))
      .reduce((s, t) => s + Number(t.amount), 0);
    return {totalIn, totalOut, txCount: completed.length};
  }, [transactions]);

  // ── Derived: filtered transactions ───────────────────────────────────
  const searchedTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.description?.toLowerCase().includes(q) ||
        t.amount.toString().includes(q) ||
        t.status?.toLowerCase().includes(q) ||
        t.type?.toLowerCase().includes(q),
    );
  }, [transactions, searchQuery]);

  // ── Actions ──────────────────────────────────────────────────────────
  const handleSendMoney = useCallback(() => {
    if (accountsLoading) {
      toast.info("Loading account information...");
      return;
    }
    if (!accounts.length) {
      toast.warning("No accounts found", {
        description: "You don't have any active accounts. Please contact support.",
      });
      return;
    }
    if (totalBalance <= 0) {
      toast.error("Insufficient Funds", {
        description: `Your balance (${fmt(totalBalance)}) is too low to send money.`,
        action: {
          label: "Add Money",
          onClick: () => guardAction(() => router.push("/dashboard/deposit"), "add money"),
        },
      });
      return;
    }
    guardAction(() => router.push("/dashboard/transfers"), "send money");
  }, [accounts, accountsLoading, totalBalance, guardAction, router]);

  const handlePayBills = useCallback(() => {
    if (accountsLoading) {
      toast.info("Loading account information...");
      return;
    }
    if (!accounts.length) {
      toast.warning("No accounts found", {description: "Please set up an account first."});
      return;
    }
    if (totalBalance <= 0) {
      toast.error("Insufficient Funds", {
        description: "Your balance is too low to pay bills.",
        action: {
          label: "Add Money",
          onClick: () => guardAction(() => router.push("/dashboard/deposit"), "add money"),
        },
      });
      return;
    }
    guardAction(() => router.push("/dashboard/payments"), "pay bills");
  }, [accounts, accountsLoading, totalBalance, guardAction, router]);

  const handleAddMoney = useCallback(
    () => guardAction(() => router.push("/dashboard/deposit"), "add money"),
    [guardAction, router],
  );

  const handleRequestMoney = useCallback(
    () => guardAction(() => router.push("/dashboard/request"), "request money"),
    [guardAction, router],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  return {
    // Data
    accounts,
    accountsLoading,
    transactions,
    txLoading,
    cards,
    cardLoading,
    profile,
    totalBalance,
    stats,
    searchedTransactions,
    // UI state
    showBalance,
    setShowBalance,
    refreshing,
    setRefreshing,
    searchQuery,
    setSearchQuery,
    // Actions
    handleSendMoney,
    handlePayBills,
    handleAddMoney,
    handleRequestMoney,
    handleRefresh,
    guardAction,
    router,
  };
}
