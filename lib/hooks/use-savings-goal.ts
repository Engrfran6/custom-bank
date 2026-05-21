// hooks/use-savings-goal.ts
import {useQuery} from "@tanstack/react-query";
import {fetchSavingsGoal} from "../requests/fetch-savings-goal";
import {SavingsGoal} from "@/types/database";

export function useSavingsGoal(userId: string | undefined) {
  // ✅ supabase client moved into the request function — not created at hook render
  return useQuery<SavingsGoal | null>({
    queryKey: ["savings-goal", userId],
    queryFn: () => fetchSavingsGoal(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}
