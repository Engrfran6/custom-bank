"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import type {SupportTicket} from "@/types/database";

interface TicketFilters {
  status?: string;
  priority?: string;
}

async function fetchAdminTickets(params: TicketFilters): Promise<SupportTicket[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.priority) qs.set("priority", params.priority);

  const res = await fetch(`/api/admin/tickets?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to load tickets");
  return data.tickets ?? [];
}

export function useAdminTickets(filters: TicketFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-tickets", filters]; // ✅ refetches on filter change automatically

  const {
    data: tickets = [],
    isLoading: loading,
    error,
  } = useQuery<SupportTicket[]>({
    queryKey,
    queryFn: () => fetchAdminTickets(filters),
    staleTime: 30 * 1000,
    // ✅ TQ handles AbortController internally — no manual abortRef needed
  });

  const {mutateAsync: updateTicket} = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: {status?: SupportTicket["status"]; admin_reply?: string};
    }) => {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id, ...updates}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ["admin-tickets"]}),
  });

  return {
    tickets,
    loading,
    error: (error as Error)?.message ?? null,
    updateTicket: (id: string, updates: {status?: SupportTicket["status"]; admin_reply?: string}) =>
      updateTicket({id, updates}),
    reload: () => queryClient.invalidateQueries({queryKey}),
  };
}
