import {fetchUserStats, UserStatsResult} from "@/lib/requests/fetch-user-stats";
import {useQuery} from "@tanstack/react-query";

interface Options {
  userId: string | undefined;
  profileLoading: boolean;
}

export function useUserStatsQuery({userId, profileLoading}: Options) {
  const {data, isLoading} = useQuery<UserStatsResult>({
    queryKey: ["user-stats", userId],
    queryFn: () => fetchUserStats(userId!),
    enabled: !!userId && !profileLoading,
    staleTime: 5 * 60 * 1000,
  });

  return {
    stats: data?.stats ?? null,
    dailyChart: data?.dailyChart ?? [],
    recentTx: data?.recentTx ?? [],
    isLoading,
  };
}
