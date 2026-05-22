import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useCallback} from "react";

import type {Account} from "@/types/database";
import {useRealtimeAccounts} from "@/lib/subscriptions/use-realtime-accounts";
import {fetchAccounts} from "@/lib/requests/fetch-accounts";

interface UseAccountsQueryOptions {
  userId: string | undefined;
  authLoading: boolean;
}

// queries/use-accounts-query.ts
export function useAccountsQuery({userId, authLoading}: UseAccountsQueryOptions) {
  const queryClient = useQueryClient();

  const {data: accounts = [], isLoading} = useQuery<Account[]>({
    queryKey: ["accounts", userId],
    queryFn: () => fetchAccounts(userId!),
    enabled: !!userId && !authLoading,
    staleTime: 5 * 60 * 1000,
  });

  // ✅ Extract account IDs from the fetched data
  const accountIds = accounts.map((a) => a.id);

  const updateCache = useCallback(
    (updater: (prev: Account[]) => Account[]) => {
      queryClient.setQueryData<Account[]>(["accounts", userId], (prev) => updater(prev ?? []));
    },
    [queryClient, userId],
  );

  useRealtimeAccounts(userId ?? null, accountIds, {
    onInsert: useCallback(
      (account) => {
        if (account.status !== "active") return;
        updateCache((prev) =>
          [...prev, account].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          ),
        );
      },
      [updateCache],
    ),

    onUpdate: useCallback(
      (account) => {
        updateCache((prev) => prev.map((a) => (a.id === account.id ? account : a)));
      },
      [updateCache],
    ),

    onDelete: useCallback(
      (id) => {
        updateCache((prev) => prev.filter((a) => a.id !== id));
      },
      [updateCache],
    ),
  });

  return {accounts, isLoading};
}
