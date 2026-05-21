"use client";
import {Transaction} from "@/types/database";
import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

export interface AdminTransaction extends Transaction {
  initiator: {full_name: string | null; email: string} | null;
  from_account: {account_number: string; account_type: string} | null;
  to_account: {account_number: string; account_type: string} | null;
}

interface Filters {
  status?: string;
  type?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  flagged?: boolean;
  page?: number;
}

// Co-located fetch — API route, single use, no extraction needed
async function fetchAdminTransactions(filters: Filters) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.flagged) params.set("flagged", "true");
  params.set("page", String(filters.page ?? 1));

  const res = await fetch(`/api/admin/transactions?${params}`);
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

async function patchTransactionStatus(id: string, status: string) {
  const res = await fetch("/api/admin/transactions", {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({id, status}),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export function useAdminTransactions(filters: Filters = {}) {
  const queryClient = useQueryClient();

  const {data, isLoading} = useQuery({
    queryKey: ["admin-transactions", filters], // filters object as key — refetches on any filter change
    queryFn: () => fetchAdminTransactions(filters),
    staleTime: 30 * 1000, // admin data — 30s stale time
  });

  const {mutateAsync: updateStatus} = useMutation({
    mutationFn: ({id, status}: {id: string; status: string}) => patchTransactionStatus(id, status),
    onSuccess: () => {
      // Invalidate all admin-transaction queries regardless of filters
      queryClient.invalidateQueries({queryKey: ["admin-transactions"]});
    },
  });

  return {
    transactions: data?.transactions ?? [],
    summary: data?.summary ?? null,
    total: data?.total ?? 0,
    loading: isLoading,
    updateStatus: (id: string, status: string) => updateStatus({id, status}),
  };
}
