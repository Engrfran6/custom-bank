import {useTransactionsQuery} from "./queries/use-transactions-query";
import {useAuthListener} from "./use-auth-listener";

export function useTransactions(limit = 10) {
  const {user, loading: authLoading} = useAuthListener();

  const {transactions, isLoading} = useTransactionsQuery({
    userId: user?.id,
    authLoading,
    limit,
  });

  return {
    transactions,
    loading: authLoading || isLoading,
  };
}

// import {useTransactionsQuery} from "./queries/use-transactions-query";
// import {useAuthListener} from "./use-auth-listener";
// import {useUserAccountIds} from "./use-user-accountIds";

// export function useTransactions(limit = 10) {
//   const {user, loading: authLoading} = useAuthListener();

//   const {accountIds, accountsLoading} = useUserAccountIds(user?.id);

//   const {transactions, isLoading} = useTransactionsQuery({
//     accountIds,
//     userId: user?.id,
//     authLoading,
//     limit,
//   });

//   return {
//     transactions,
//     loading: authLoading || accountsLoading || isLoading,
//     userId: user?.id,
//     userAccountIds: accountIds,
//   };
// }
