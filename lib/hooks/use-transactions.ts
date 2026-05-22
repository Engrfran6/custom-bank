import {useTransactionsQuery} from "../queries/use-transactions-query";
import {useAccounts} from "./use-accounts";
import {useAuthListener} from "./use-auth-listener";

export function useTransactions(limit = 10) {
  const {user, loading: authLoading} = useAuthListener();
  const {accountIds, loading} = useAccounts();
  const {transactions, isLoading} = useTransactionsQuery({
    userId: user?.id,
    accountIds,
    authLoading,
    limit,
  });

  return {
    transactions,
    loading: authLoading || loading || isLoading,
  };
}
