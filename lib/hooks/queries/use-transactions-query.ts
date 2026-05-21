import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useCallback} from "react";
import {useRealtimeTransactions} from "@/lib/subscriptions/use-realtime-transactions";
import {fetchTransactions, TransactionHistory} from "@/lib/requests/fetch-transactions";

interface Options {
  userId: string | undefined;
  authLoading: boolean;
  limit: number;
  accountIds: string[];
}

export function useTransactionsQuery({accountIds, userId, authLoading, limit}: Options) {
  const queryClient = useQueryClient();

  // Realtime: any change → just refetch, transactions are complex to patch manually
  const handleChange = useCallback(() => {
    queryClient.invalidateQueries({queryKey: ["transactions", userId]});
  }, [queryClient, userId]);

  useRealtimeTransactions(userId ?? null, handleChange);

  const {data: transactions = [], isLoading} = useQuery<TransactionHistory[]>({
    queryKey: ["transactions", userId, accountIds, limit],
    queryFn: () => fetchTransactions(accountIds, limit),
    enabled: !!userId && !authLoading && accountIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  // No more transactionsWithDirection — direction is already on each tx
  return {transactions, isLoading};
}
