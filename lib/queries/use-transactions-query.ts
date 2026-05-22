import {useQuery} from "@tanstack/react-query";
import {fetchTransactions} from "@/lib/requests/fetch-transactions";
import {TransactionHistory} from "../mapper/db-transaction-to-user";

interface Options {
  userId: string | undefined;
  accountIds: string[];
  authLoading: boolean;
  limit: number;
}

export function useTransactionsQuery({userId, accountIds, authLoading, limit}: Options) {
  const {data: transactions = [], isLoading} = useQuery<TransactionHistory[]>({
    queryKey: ["transactions", userId, accountIds, limit],
    queryFn: () => fetchTransactions(accountIds!, limit),
    enabled: !!userId && !authLoading && accountIds.length > 0,
    staleTime: 2 * 60 * 1000, // transactions go stale faster than profile
  });

  return {transactions, isLoading};
}
