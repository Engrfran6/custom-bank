import {createClient} from "../supabase/client-with-offline";
import {TransactionHistory} from "../mapper/db-transaction-to-user";

export async function fetchTransactions(
  accountIds: string[],
  limit: number,
): Promise<TransactionHistory[]> {
  const supabase = createClient();

  if (accountIds.length === 0) return [];

  const {data, error} = await supabase
    .from("entries")
    .select(
      `
    id,
    type,
    amount,
    balance_after,
    account_id,
    created_at,

    transaction:transactions(
      id,
      reference,
      amount,
      fee,
      currency,
      status,
      description,
      type,
      initiated_by,
      metadata,
      created_at,
      updated_at,
      from_account_id,
      to_account_id,

      from_account:accounts!from_account_id(
        account_number,
        account_type
      ),

      to_account:accounts!to_account_id(
        account_number,
        account_type
      )
    )
  `,
    )
    .in("account_id", accountIds)
    .order("created_at", {ascending: false})
    .limit(limit);

  console.log("viewing errors=============>", error);

  if (error) throw error;

  console.log("viewing transactions=============>", data);

  // Map the data to app Transaction type
  return (data as unknown as TransactionHistory[]) || [];
}
