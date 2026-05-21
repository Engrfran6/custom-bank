"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {useAuthListener} from "./use-auth-listener";
import {fetchReports, insertReport} from "../requests/fetch-reports";
import type {Report} from "@/types/database";

type ReportPayload = Omit<
  Report,
  | "id"
  | "user_id"
  | "reference"
  | "status"
  | "admin_notes"
  | "resolved_at"
  | "created_at"
  | "updated_at"
>;

export function useReports() {
  const {user, loading: authLoading} = useAuthListener();
  const queryClient = useQueryClient();

  const {
    data: reports = [],
    isLoading,
    error,
  } = useQuery<Report[]>({
    queryKey: ["reports", user?.id],
    queryFn: () => fetchReports(user!.id),
    enabled: !!user?.id && !authLoading,
    staleTime: 2 * 60 * 1000,
  });

  const {mutateAsync: submitReport} = useMutation({
    mutationFn: (payload: ReportPayload) => insertReport(user!.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["reports", user?.id]});
    },
  });

  return {
    reports,
    loading: authLoading || isLoading,
    error: error?.message ?? null,
    submitReport,
  };
}
