"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import type {Account, Transaction} from "@/types/database";
import {useState} from "react";

// ── Fetch functions ───────────────────────────────────────────────────

async function fetchUserAccounts(userId: string): Promise<Account[]> {
  const res = await fetch(`/api/admin/users/${userId}/accounts`);
  if (!res.ok) throw new Error("Failed to load accounts");
  const data = await res.json();
  return data.accounts;
}

async function fetchAccountTransactions(
  userId: string,
  accountId: string,
  page: number,
): Promise<{transactions: Transaction[]; total: number; page: number; totalPages: number}> {
  const res = await fetch(
    `/api/admin/users/${userId}/accounts/${accountId}/transactions?page=${page}&limit=20`,
  );
  if (!res.ok) throw new Error("Failed to load transactions");
  return res.json();
}

// ── useUserAccounts ───────────────────────────────────────────────────

export function useUserAccounts(userId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-user-accounts", userId];

  const {
    data: accounts = [],
    isLoading: loadingAccount,
    error,
  } = useQuery<Account[]>({
    queryKey,
    queryFn: () => fetchUserAccounts(userId),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });

  const {mutateAsync: createAccount, isPending: loadingCreateAccount} = useMutation({
    mutationFn: async ({
      accountType,
      currency = "USD",
    }: {
      accountType: string;
      currency?: string;
    }) => {
      const res = await fetch(`/api/admin/users/${userId}/accounts`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({account_type: accountType, currency}),
      });
      if (!res.ok) throw new Error("Failed to create account");
      const data = await res.json();
      return data.account as Account;
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey}),
  });

  const {mutateAsync: fundAccount, isPending: loadingFundAccount} = useMutation({
    mutationFn: async ({
      accountId,
      amount,
      description,
    }: {
      accountId: string;
      amount: number;
      description?: string;
    }) => {
      const res = await fetch(`/api/admin/users/${userId}/accounts/${accountId}/fund`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({amount, description}),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey}),
  });

  const {mutateAsync: closeAccount, isPending: loadingCloseAccount} = useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(`/api/admin/users/${userId}/accounts/${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey}),
  });

  const loading =
    loadingAccount || loadingCreateAccount || loadingFundAccount || loadingCloseAccount;

  return {
    accounts,
    loading,
    error: (error as Error)?.message ?? null,
    loadAccounts: () => queryClient.invalidateQueries({queryKey}),
    createAccount: (accountType: string, currency?: string) =>
      createAccount({accountType, currency}),
    fundAccount: (accountId: string, amount: number, description?: string) =>
      fundAccount({accountId, amount, description}),
    closeAccount,
  };
}

// ── useAccountTransactions ────────────────────────────────────────────

export function useAccountTransactions(userId: string, accountId: string) {
  // Page lives as state since it drives the queryKey
  const [page, setPageState] = useState(1);

  const {
    data,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["admin-account-transactions", userId, accountId, page],
    queryFn: () => fetchAccountTransactions(userId, accountId, page),
    enabled: !!userId && !!accountId,
    staleTime: 30 * 1000,
    placeholderData: (prev) => prev, // keep previous page data while next loads
  });

  return {
    transactions: data?.transactions ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    totalPages: data?.totalPages ?? 0,
    loading,
    error: (error as Error)?.message ?? null,
    loadTransactions: (p: number) => setPageState(p),
    setPage: (p: number) => setPageState(p),
  };
}
