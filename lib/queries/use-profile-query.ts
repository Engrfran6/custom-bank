import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useCallback} from "react";
import {Profile} from "@/types/database";
import {useRealtimeProfile} from "../subscriptions/use-realtime-profile";
import {fetchUserProfile} from "../requests/fetch-user-profile";

interface UseProfileQueryOptions {
  userId: string | undefined;
  authLoading: boolean;
  isOffline: boolean;
}

export function useProfileQuery({userId, authLoading, isOffline}: UseProfileQueryOptions) {
  const queryClient = useQueryClient();

  // Sync realtime updates directly into the TQ cache
  const handleProfileUpdate = useCallback(
    (updatedProfile: Profile) => {
      queryClient.setQueryData(["profile", userId], updatedProfile);
    },
    [queryClient, userId],
  );

  const noopHandler = useCallback(() => {}, []);

  useRealtimeProfile(userId ?? null, isOffline ? noopHandler : handleProfileUpdate);

  const {data: profile, isLoading: queryLoading} = useQuery<Profile>({
    queryKey: ["profile", userId],
    queryFn: () => {
      if (!userId) throw new Error("No user ID");
      if (isOffline) {
        const cached = queryClient.getQueryData<Profile>(["profile", userId]);
        if (cached) return cached;
        throw new Error("You are offline");
      }
      return fetchUserProfile(userId);
    },
    enabled: !!userId && !authLoading && !isOffline,
    staleTime: 5 * 60 * 1000,
  });

  return {
    profile,
    // Only show loading when online — offline relies on cache silently
    isLoading: !isOffline && queryLoading,
  };
}
