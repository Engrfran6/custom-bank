"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {useAuthListener} from "./use-auth-listener";
import {fetchSupportTickets, insertSupportTicket} from "../requests/fetch-support-tickets";
import type {SupportTicket} from "@/types/database";

export function useSupportTickets() {
  const {user, loading: authLoading} = useAuthListener();
  const queryClient = useQueryClient();

  const {
    data: tickets = [],
    isLoading,
    error,
  } = useQuery<SupportTicket[]>({
    queryKey: ["support-tickets", user?.id],
    queryFn: () => fetchSupportTickets(user!.id),
    enabled: !!user?.id && !authLoading,
    staleTime: 2 * 60 * 1000,
  });

  const {mutateAsync: submitTicket} = useMutation({
    mutationFn: (payload: Pick<SupportTicket, "subject" | "category" | "priority" | "message">) =>
      insertSupportTicket(user!.id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["support-tickets", user?.id]});
    },
  });

  return {
    tickets,
    loading: authLoading || isLoading,
    error: error?.message ?? null,
    submitTicket,
  };
}
