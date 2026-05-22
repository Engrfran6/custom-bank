import {EntryType, Transaction, TransactionStatus, TransactionType} from "@/types/database";

export interface TransactionHistory {
  id: string;
  account_id: string;
  amount: string;
  type: EntryType; // "debit" | "credit"
  created_at: string;

  transaction: {
    id: string;
    reference: string;
    amount: string;
    fee: string;
    currency: string;
    status: TransactionStatus;
    description: string | null;
    type: TransactionType;
    metadata: Record<string, unknown> | string;
    from_account_id: string; // ← add
    to_account_id: string;
    initiated_by: string;
    from_account: {
      account_number: string;
      account_type: string;
    } | null;
    to_account: {
      account_number: string;
      account_type: string;
    } | null;
    created_at: string;
    updated_at: string;
  };
}

// Helper function to map DatabaseTransaction to AppTransaction
export function mapToAppTransaction(transactionHistory: TransactionHistory): Transaction {
  const tx = transactionHistory.transaction;

  return {
    id: tx.id,
    reference: tx.reference,
    initiated_by: tx.initiated_by,
    from_account_id: tx.from_account_id,
    to_account_id: tx.to_account_id,
    amount: typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount,
    fee: typeof tx.fee === "string" ? parseFloat(tx.fee) : tx.fee,
    currency: tx.currency,
    direction: transactionHistory.type, // 'debit' or 'credit' from EntryType
    type: tx.type as TransactionType,
    status: tx.status as TransactionStatus,
    description: tx.description,
    metadata: typeof tx.metadata === "string" ? JSON.parse(tx.metadata) : tx.metadata,
    created_at: tx.created_at,
    updated_at: tx.updated_at,
  };
}
