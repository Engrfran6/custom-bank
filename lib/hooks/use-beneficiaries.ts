"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {useAuthListener} from "./use-auth-listener";
import {fetchBeneficiaries} from "../requests/fetch-beneficiaries";
import {createClient} from "@/lib/supabase/client-with-offline";
import type {Beneficiary} from "@/types/database";

export function useBeneficiaries() {
  const {user, loading: authLoading} = useAuthListener();
  const queryClient = useQueryClient();
  const queryKey = ["beneficiaries", user?.id];

  const {data: beneficiaries = [], isLoading} = useQuery<Beneficiary[]>({
    queryKey,
    queryFn: () => fetchBeneficiaries(user!.id),
    enabled: !!user?.id && !authLoading,
    staleTime: 5 * 60 * 1000,
  });

  const {mutateAsync: addBeneficiary} = useMutation({
    mutationFn: async (payload: Omit<Beneficiary, "id" | "user_id" | "created_at">) => {
      const supabase = createClient();
      const {error} = await supabase.from("beneficiaries").insert({...payload, user_id: user!.id});
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({queryKey}),
  });

  const {mutateAsync: removeBeneficiary} = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const {error} = await supabase.from("beneficiaries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      // Optimistic cache update — no refetch needed
      queryClient.setQueryData<Beneficiary[]>(
        queryKey,
        (prev) => prev?.filter((b) => b.id !== id) ?? [],
      );
    },
  });

  return {
    beneficiaries,
    loading: authLoading || isLoading,
    addBeneficiary,
    removeBeneficiary,
  };
}
