import {useAccountsQuery} from "../queries/use-accounts-query";
import {useAuthListener} from "./use-auth-listener";

export function useAccounts() {
  const {user, loading: authLoading} = useAuthListener();

  const {accounts, isLoading} = useAccountsQuery({
    userId: user?.id,
    authLoading,
  });

  // Derived — belongs here, not in the query layer
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0);

  return {
    accounts,
    loading: authLoading || isLoading,
    totalBalance,
  };
}
