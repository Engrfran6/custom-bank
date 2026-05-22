import {useQuery, useQueryClient} from "@tanstack/react-query";
import {useCallback} from "react";
import {useRealtimeTransactions} from "@/lib/subscriptions/use-realtime-transactions";
import {fetchTransactions} from "@/lib/requests/fetch-transactions";
import {mapToAppTransaction, TransactionHistory} from "../mapper/db-transaction-to-user";

interface Options {
  userId: string | undefined;
  accountIds: string[];
  authLoading: boolean;
  limit: number;
}

export function useTransactionsQuery({userId, accountIds, authLoading, limit}: Options) {
  const queryClient = useQueryClient();

  // Realtime: any change → just refetch, transactions are complex to patch manually
  const handleChange = useCallback(() => {
    queryClient.invalidateQueries({queryKey: ["transactions", userId]});
  }, [queryClient, userId]);

  useRealtimeTransactions(userId ?? null, handleChange);

  const {data: transactions = [], isLoading} = useQuery<TransactionHistory[]>({
    queryKey: ["transactions", userId, accountIds, limit],
    queryFn: () => fetchTransactions(accountIds!, limit),
    enabled: !!userId && !authLoading && accountIds.length > 0,
    staleTime: 2 * 60 * 1000, // transactions go stale faster than profile
  });

  // const transactions = data.map(mapToAppTransaction);

  console.log("viewing mapped transactions=============>", transactions);

  return {transactions, isLoading};
}
