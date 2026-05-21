import {createClient} from "@/lib/supabase/client-with-offline";
import type {Transaction} from "@/types/database";

export async function fetchTransactions(userId: string, limit: number): Promise<Transaction[]> {
  const supabase = createClient();

  const {data, error} = await supabase
    .from("transactions")
    .select(
      `
      *,
      from_account:accounts!from_account_id(account_number, account_type),
      to_account:accounts!to_account_id(account_number, account_type)
    `,
    )
    .eq("initiated_by", userId)
    .order("created_at", {ascending: false})
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

// import {EntryType, TransactionStatus, TransactionType} from "@/types/database";
// import {createClient} from "../supabase/client-with-offline";

// export interface Transaction {
//   id: string;
//   reference: string;
//   amount: string;
//   fee: string;
//   currency: string;
//   status: TransactionStatus;
//   description: string | null;
//   type: TransactionType;
//   metadata: Record<string, unknown> | string;
//   from_account_id: string; // ← add
//   to_account_id: string;
//   initiated_by: string;
//   from_account: {
//     account_number: string;
//     account_type: string;
//   } | null;
//   to_account: {
//     account_number: string;
//     account_type: string;
//   } | null;
//   created_at: string;
//   updated_at: string;
// }

// export interface TransactionHistory {
//   id: string;
//   account_id: string;
//   type: EntryType; // "debit" | "credit"
//   created_at: string;
//   transaction: Transaction;
// }

// export async function fetchTransactions(
//   accountIds: string[],
//   limit: number,
// ): Promise<TransactionHistory[]> {
//   const supabase = createClient();

//   if (accountIds.length === 0) return [];

//   const {data, error} = await supabase
//     .from("entries")
//     .select(
//       `
//       id,
//       type,
//       account_id,
//       created_at,
//       transaction:transactions!transaction_id(
//         id,reference,amount,fee,currency,status,description,type,initiated_by,metadata,created_at,updated_at,from_account_id,to_account_id,
//         from_account:accounts!from_account_id(account_number, account_type),
//         to_account:accounts!to_account_id(account_number, account_type)
//       )
//     `,
//     )
//     .in("account_id", accountIds)
//     .order("created_at", {ascending: false})
//     .limit(limit);

//   console.log("checking new data======================>", data);

//   if (error) throw error;
//   return (data as unknown as TransactionHistory[]) ?? [];
// }
