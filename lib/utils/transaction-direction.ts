import {Transaction} from "@/types/database";

export function getTransactionDirection(
  tx: Transaction,
  userAccountIds: string[],
): "debit" | "credit" {
  if (userAccountIds.includes(tx.from_account_id)) return "debit";
  if (userAccountIds.includes(tx.to_account_id)) return "credit";
  return "debit"; // fallback
}
