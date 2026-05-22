export type UserRole = "user" | "admin";
export type KycStatus = "pending" | "verified" | "rejected";
export type AccountType = "checking" | "savings" | "investment" | "system_reserve" | "system_fees";
export type AccountStatus = "active" | "frozen" | "closed";
export type TransactionType =
  | "internal_transfer"
  | "external_transfer"
  | "bill_payment"
  | "deposit"
  | "withdrawal"
  | "fee"
  | "admin_funding"
  | "savings_deposit"
  | "check_deposit"
  | "external_deposit";

export type TransactionDirection = "debit" | "credit";
export type TransactionStatus = "pending" | "processing" | "completed" | "failed" | "reversed";
export type EntryType = "debit" | "credit";
export type CardType = "debit" | "credit";
export type CardStatus = "active" | "frozen" | "cancelled";

export interface SuspensionDetails {
  is_suspended?: boolean;
  suspension_details?: string | null;
  suspension_reason?: string | null;
  suspended_by?: string;
  suspended_at?: string;
  reactivation_reason?: string;
  email?: string;
}

export interface FraudDetails {
  fraud_flagged?: boolean;
  fraud_reason?: string | null;
  fraud_details?: string | null;
  fraud_flagged_at?: string;
  fraud_flagged_by?: string;
}

export interface Profile {
  id?: string;
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  role?: UserRole;
  kyc_status?: KycStatus;

  // Address fields
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;

  // Personal info
  date_of_birth?: string | null;
  ssn?: string | null;
  is_us_citizen?: boolean | null;

  // Suspension fields
  is_suspended?: boolean;
  suspension_details?: string | null;
  suspension_reason?: string | null;
  suspended_by?: string;
  suspended_at?: string;

  // Fraud fields
  fraud_flagged?: boolean;
  fraud_reason?: string | null;
  fraud_details?: string | null;
  fraud_flagged_at?: string;
  fraud_flagged_by?: string;

  // Reactivation fields
  reactivation_reason?: string;
  reactivated_by?: string;
  reactivated_at?: string;

  // ID/Document verification
  id_type?: string | null;
  id_number?: string | null;
  id_document_url?: string | null;
  id_verified_at?: string | null;

  // Next of kin
  next_of_kin_name?: string | null;
  next_of_kin_relationship?: string | null;
  next_of_kin_phone?: string | null;
  next_of_kin_email?: string | null;
  next_of_kin_address?: string | null;

  // Employment & income
  employment_status?: string | null;
  employer_name?: string | null;
  annual_income?: string | null;
  source_of_funds?: string | null;

  // Compliance
  pep_status?: boolean;
  tax_residence_country?: string | null;
  tin?: string | null; // Tax Identification Number

  // Profile metadata
  profile_updated_at?: string;
  profile_updated_by?: string | null;

  // KYC metadata
  kyc_submitted_at?: string | null;
  kyc_reviewed_at?: string | null;
  kyc_reviewed_by?: string | null;
  kyc_rejection_reason?: string | null;

  // Timestamps
  created_at?: string;
  updated_at?: string;
}

export interface Account {
  id: string;
  user_id: string | null;
  account_number: string;
  account_type: AccountType;
  currency: string;
  balance: number;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  reference: string;
  initiated_by: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  fee: number;
  currency: string;
  direction?: TransactionDirection;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  transaction_id: string;
  account_id: string;
  type: EntryType;
  amount: number;
  balance_after: number;
  created_at: string;
}

export interface Beneficiary {
  id: string;
  user_id: string;
  created_at: string;

  // Core
  nickname: string;
  full_name: string;
  account_name?: string;
  account_number: string;
  is_internal: boolean;

  // Bank details
  bank_name: string;
  bank_code?: string; // was required, now optional
  bank_address?: string;

  // Routing (domestic + wire)
  routing_number?: string;

  // International
  swift_code?: string;
  country?: string;
  currency?: string; // useful for international
}

export interface Card {
  id: string;
  user_id: string;
  account_id: string;
  card_number: string;
  card_type: CardType;
  status: CardStatus;
  expiry_month: number;
  expiry_year: number;
  daily_limit: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  is_read: boolean;
  type: "info" | "warning" | "success" | "error";
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  reference: string;
  category: string;
  description: string;
  amount?: number;
  transaction_id?: string;
  date_occurred: string;
  urgent_contact: boolean;
  status: "investigating" | "under_review" | "resolved";
  admin_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  reference: string;
  subject: string;
  category: "transaction" | "account" | "card" | "security" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  message: string;
  admin_reply?: string;
  replied_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: "user" | "admin";
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  admin_id: string | null;
  status: "active" | "resolved" | "archived";
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  created_at: string;
  updated_at: string;
  deadline: Date | null;
}

export interface Biller {
  id: string;
  name: string;
  type: string;
  logo: string;
}

export interface BillPayment {
  id: string;
  biller_name: string;
  biller_type: string;
  biller_phone?: string;
  biller_email?: string;
  biller_address?: string;
  account_ref: string;
  amount: number;
  status: string;
  created_at: string;
  scheduled_at?: string;
  paid_at?: string;
  is_recurring: boolean;
  recurring_interval?: string;
  payment_method?: string;
  reference: string;
  notes?: string;
}

export interface PaymentRequest {
  id: string;
  request_id: string;
  requester_name: string;
  amount: number;
  currency: string;
  purpose: string;
  status: "pending" | "paid" | "expired" | "cancelled";
  created_at: string;
  expires_at: string;
  paid_at?: string;
}

export interface PaymentDetails {
  id?: string;
  payment_request_id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  swift_code: string;
  crypto_address: string;
  crypto_network: string;
  payment_instructions: string;
}

export interface UniversalPaymentDetails {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  swift_code: string;
  crypto_address: string;
  crypto_network: string;
  payment_instructions: string;
  is_active: boolean;
}

export type CodeStatus = "pending" | "used" | "expired" | "cancelled";

export interface TransactionCode {
  id: string;
  code: string;
  user_id: string;
  amount: number;
  status: CodeStatus;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  profile?: {full_name: string | null} | null; // ✅ joined
}

export interface AccessCode {
  id: string;
  code: string;
  user_id: string;
  status: CodeStatus;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  profile?: {full_name: string | null} | null; // ✅ joined
}

export interface CodeVerifyResult {
  ok: boolean;
  message: string;
}

export interface UserStats {
  totalIn: number;
  totalOut: number;
  totalTransactions: number;
  averageTransaction: number;
  largestTransaction: number;
  savingsRate: number;
}

export interface DailyPoint {
  date: string;
  volume: number;
  count: number;
  income: number;
  expenses: number;
}

export interface UserStatsResult {
  stats: UserStats;
  dailyChart: DailyPoint[];
  recentTx: Transaction[];
}

// export interface Transaction {
//   id: string;
//   reference: string;
//   initiated_by: string;
//   from_account_id: string;
//   to_account_id: string;
//   amount: number;
//   fee: number;
//   currency: string;
//   type: TransactionType;
//   status: TransactionStatus;
//   description: string | null;
//   metadata: Record<string, unknown>;
//   created_at: string;
//   updated_at: string;
//   from_account?: Account;
//   to_account?: Account;
// }
