import {useUserStatsQuery} from "../queries/use-user-stats-query";
import {useProfile} from "./use-profile";

export function useUserStats() {
  const {user, isLoading: profileLoading} = useProfile();

  const {stats, dailyChart, recentTx, isLoading} = useUserStatsQuery({
    userId: user?.id,
    profileLoading,
  });

  return {
    stats,
    dailyChart,
    recentTx,
    loading: profileLoading || isLoading,
  };
}
