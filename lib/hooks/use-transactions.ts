import {useTransactionsQuery} from "../queries/use-transactions-query";
import {useAuthListener} from "./use-auth-listener";
import {useUserAccountIds} from "./use-user-accountIds";

export function useTransactions(limit = 10) {
  const {user, loading: authLoading} = useAuthListener();
  const {accountIds, accountsLoading} = useUserAccountIds(user?.id);
  const {transactions, isLoading} = useTransactionsQuery({
    userId: user?.id,
    accountIds,
    authLoading,
    limit,
  });

  return {
    transactions,
    loading: authLoading || accountsLoading || isLoading,
  };
}
