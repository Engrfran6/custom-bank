"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import type {Report} from "@/types/database";

interface ReportFilters {
  status?: string;
}

async function fetchAdminReports(params: ReportFilters): Promise<Report[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);

  const res = await fetch(`/api/admin/reports?${qs}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Failed to load reports");
  return data.reports ?? [];
}

export function useAdminReports(filters: ReportFilters = {}) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-reports", filters];

  const {
    data: reports = [],
    isLoading: loading,
    error,
  } = useQuery<Report[]>({
    queryKey,
    queryFn: () => fetchAdminReports(filters),
    staleTime: 30 * 1000,
  });

  const {mutateAsync: updateStatus} = useMutation({
    mutationFn: async ({
      id,
      status,
      admin_notes,
    }: {
      id: string;
      status: Report["status"];
      admin_notes?: string;
    }) => {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({id, status, admin_notes}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey: ["admin-reports"]}),
  });

  return {
    reports,
    loading,
    error: (error as Error)?.message ?? null,
    updateStatus: (id: string, status: Report["status"], admin_notes?: string) =>
      updateStatus({id, status, admin_notes}),
    reload: () => queryClient.invalidateQueries({queryKey}),
  };
}
