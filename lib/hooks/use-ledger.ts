"use client";

import {useCallback, useEffect, useState} from "react";

interface Account {
  account_number: string;
  account_type: string;
  balance: number;
  user_id: string | null;
  profiles: {full_name: string | null; email: string} | null;
}

export interface Entries {
  id: string;
  account: Account;
  type: "debit" | "credit";
  amount: number;
  balance_after: number;
  created_at: string;
}

interface Transaction {
  reference: string;
  type: string;
  status: string;
  description: string | null;
  amount: number;
  fee: number;
  created_at: string;
  initiator: {full_name: string | null; email: string} | null;
  entries: Entries[];
  from_account: Account;
  to_account: Account;
}

export interface LedgerEntry {
  id: string;
  transaction_id: string;
  account_id: string;
  type: "debit" | "credit";
  amount: number;
  balance_after: number;
  created_at: string;
  account: Account;
  transaction: Transaction;
}

export interface LedgerAccount {
  id: string;
  account_number: string;
  account_type: string;
  balance: number;
  user_id: string | null;
  profiles: {full_name: string | null; email: string} | null;
}

export interface LedgerSummary {
  totalDebits: number;
  totalCredits: number;
  balanced: boolean;
}

export interface TransactionDrilldown {
  transaction: Transaction;
  audit: {
    debitTotal: number;
    creditTotal: number;
    isBalanced: boolean;
    entryCount: number;
  };
}

interface LedgerFilters {
  account_id?: string;
  type?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  pageSize?: number;
}

export function useLedger(filters: LedgerFilters = {}) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.account_id) params.set("account_id", filters.account_id);
    if (filters.type && filters.type !== "all") params.set("type", filters.type);
    if (filters.date_from) params.set("date_from", filters.date_from);
    if (filters.date_to) params.set("date_to", filters.date_to);
    params.set("page", String(filters.page ?? 1));
    params.set("pageSize", String(filters.pageSize ?? 25));

    const res = await fetch(`/api/admin/ledger?${params}`);
    const data = await res.json();

    setEntries(data.entries ?? []);
    setAccounts(data.accounts ?? []);
    setSummary(data.summary ?? null);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [
    filters.account_id,
    filters.type,
    filters.date_from,
    filters.date_to,
    filters.page,
    filters.pageSize,
  ]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  return {entries, accounts, summary, total, loading, reload: load};
}

export function useTransactionDrilldown(id: string | null) {
  const [data, setData] = useState<TransactionDrilldown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      (async () => {
        setData(null);
      })();
      return;
    }
    (async () => {
      setLoading(true);
    })();

    (async () => {
      setError(null);
    })();

    fetch(`/api/admin/ledger/transaction/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load transaction"))
      .finally(() => setLoading(false));
  }, [id]);

  return {data, loading, error};
}
