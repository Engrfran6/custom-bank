"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {useAuthListener} from "./use-auth-listener";
import {fetchBillHistory} from "../requests/fetch-bills";
import type {BillPayment, Biller} from "@/types/database";

// ── Billers — API route ───────────────────────────────────────────────

async function fetchBillers(): Promise<Biller[]> {
  const res = await fetch("/api/bills");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.billers;
}

async function postBillPayment(payload: {
  from_account_id: string;
  biller_id: string;
  account_ref: string;
  amount: number;
  scheduled_at?: string;
  is_recurring?: boolean;
}) {
  const res = await fetch("/api/bills", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Payment failed");
  return data;
}

export function useBillers() {
  const {data: billers = [], isLoading: loading} = useQuery<Biller[]>({
    queryKey: ["billers"],
    queryFn: fetchBillers,
    staleTime: 10 * 60 * 1000, // billers rarely change
  });
  return {billers, loading};
}

export function useBillHistory() {
  const {user, loading: authLoading} = useAuthListener();

  const {data: bills = [], isLoading} = useQuery<BillPayment[]>({
    queryKey: ["bill-history", user?.id],
    queryFn: () => fetchBillHistory(user!.id),
    enabled: !!user?.id && !authLoading,
    staleTime: 2 * 60 * 1000,
  });

  return {
    bills,
    loading: authLoading || isLoading,
  };
}

export function usePayBill() {
  const queryClient = useQueryClient();
  const {user} = useAuthListener();

  const {
    mutateAsync,
    isPending: loading,
    error,
    isSuccess: success,
    reset,
  } = useMutation({
    mutationFn: postBillPayment,
    onSuccess: () => {
      // Invalidate both — balance changes + bill history updates
      queryClient.invalidateQueries({queryKey: ["bill-history", user?.id]});
      queryClient.invalidateQueries({queryKey: ["accounts", user?.id]});
      queryClient.invalidateQueries({queryKey: ["transactions", user?.id]});
    },
  });

  return {
    pay: mutateAsync,
    loading,
    error: error?.message ?? null,
    success,
    reset,
  };
}
