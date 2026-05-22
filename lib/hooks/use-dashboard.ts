// lib/hooks/use-dashboard.ts
"use client";

import {useCallback, useMemo, useState} from "react";

import {useRouter} from "next/navigation";

import {toast} from "sonner";

import {useAccounts} from "@/lib/hooks/use-accounts";
import {useTransactions} from "@/lib/hooks/use-transactions";
import {useCards} from "@/lib/hooks/use-card";
import {useProfile} from "@/lib/hooks/use-profile";

import {useFraud} from "@/lib/context/fraud-context";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatCurrency = (amount: number) => {
  return currencyFormatter.format(amount);
};

export function useDashboard() {
  const router = useRouter();

  const {guardAction} = useFraud();

  /**
   * Data hooks
   */
  const {accounts, loading: accountsLoading, totalBalance} = useAccounts();

  const {transactions, loading: txLoading} = useTransactions(30);

  const {cards, loading: cardLoading} = useCards();

  const {profile} = useProfile();

  /**
   * UI state
   */
  const [showBalance, setShowBalance] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Dashboard stats
   *
   * Transaction history is now
   * entry-based, so use:
   *
   * entry.type
   * entry.transaction
   */
  const stats = useMemo(() => {
    const completed = transactions.filter((entry) => entry.transaction.status === "completed");

    const totalIn = completed
      .filter((entry) => entry.type === "credit")
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    const totalOut = completed
      .filter((entry) => entry.type === "debit")
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    return {
      totalIn,
      totalOut,
      txCount: completed.length,
    };
  }, [transactions]);

  /**
   * Search
   */
  const searchedTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return transactions;
    }

    const query = searchQuery.toLowerCase().trim();

    return transactions.filter((entry) => {
      const tx = entry.transaction;

      return (
        tx.description?.toLowerCase().includes(query) ||
        tx.reference?.toLowerCase().includes(query) ||
        tx.status?.toLowerCase().includes(query) ||
        tx.type?.toLowerCase().includes(query) ||
        String(entry.amount).includes(query)
      );
    });
  }, [transactions, searchQuery]);

  /**
   * Send money
   */
  const handleSendMoney = useCallback(() => {
    if (accountsLoading) {
      toast.info("Loading account information...");

      return;
    }

    if (!accounts.length) {
      toast.warning("No accounts found", {
        description: "You don't have any active accounts.",
      });

      return;
    }

    if (totalBalance <= 0) {
      toast.error("Insufficient Funds", {
        description: `Your balance (${formatCurrency(totalBalance)}) is too low to send money.`,

        action: {
          label: "Add Money",

          onClick: () => guardAction(() => router.push("/dashboard/deposit"), "add money"),
        },
      });

      return;
    }

    guardAction(() => router.push("/dashboard/transfers"), "send money");
  }, [accounts, accountsLoading, totalBalance, guardAction, router]);

  /**
   * Pay bills
   */
  const handlePayBills = useCallback(() => {
    if (accountsLoading) {
      toast.info("Loading account information...");

      return;
    }

    if (!accounts.length) {
      toast.warning("No accounts found", {
        description: "Please set up an account first.",
      });

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

  /**
   * Add money
   */
  const handleAddMoney = useCallback(() => {
    guardAction(() => router.push("/dashboard/deposit"), "add money");
  }, [guardAction, router]);

  /**
   * Request money
   */
  const handleRequestMoney = useCallback(() => {
    guardAction(() => router.push("/dashboard/request"), "request money");
  }, [guardAction, router]);

  /**
   * Refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);

    const timeout = setTimeout(() => {
      setRefreshing(false);
    }, 1500);

    return () => clearTimeout(timeout);
  }, []);

  return {
    /**
     * Data
     */
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

    /**
     * UI state
     */
    showBalance,
    setShowBalance,

    refreshing,
    setRefreshing,

    searchQuery,
    setSearchQuery,

    /**
     * Actions
     */
    handleSendMoney,
    handlePayBills,
    handleAddMoney,
    handleRequestMoney,
    handleRefresh,

    /**
     * Utilities
     */
    guardAction,
    router,
  };
}
