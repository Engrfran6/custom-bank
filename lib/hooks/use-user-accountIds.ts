// lib/hooks/use-user-account-ids.ts
import {useQuery} from "@tanstack/react-query";
import {createClient} from "@/lib/supabase/client-with-offline";

async function fetchAccountIds(userId: string): Promise<string[]> {
  const supabase = createClient();
  const {data, error} = await supabase.from("accounts").select("id").eq("user_id", userId);

  if (error) throw error;
  return data?.map((a) => a.id) ?? [];
}

export function useUserAccountIds(userId?: string) {
  const {data: accountIds = [], isLoading: accountsLoading} = useQuery<string[]>({
    queryKey: ["accountIds", userId],
    queryFn: () => fetchAccountIds(userId!),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });

  return {accountIds, accountsLoading};
}
