import {createClient} from "@/lib/supabase/client-with-offline";
import type {TransactionCode, AccessCode, CodeVerifyResult} from "@/types/database";

// ── Create ────────────────────────────────────────────────────────────

export async function createTransactionCode(amount: number): Promise<TransactionCode> {
  const supabase = createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const code = generateCode();

  const {data, error} = await supabase
    .from("transaction_codes")
    .insert({
      code,
      user_id: user.id,
      amount,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createAccessCode(): Promise<AccessCode> {
  const supabase = createClient();
  const {
    data: {user},
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const code = generateCode();

  const {data, error} = await supabase
    .from("access_codes")
    .insert({
      code,
      user_id: user.id,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ── Verify (calls DB function — atomic check + consume) ───────────────

export async function verifyTransactionCode(
  code: string,
  amount: number,
): Promise<CodeVerifyResult> {
  const supabase = createClient();
  const {data, error} = await supabase.rpc("verify_transaction_code", {
    p_code: code,
    p_amount: amount,
  });
  if (error) throw error;
  return data as CodeVerifyResult;
}

export async function verifyAccessCode(code: string): Promise<CodeVerifyResult> {
  const supabase = createClient();
  const {data, error} = await supabase.rpc("verify_access_code", {p_code: code});
  if (error) throw error;
  return data as CodeVerifyResult;
}

// ── Cancel ────────────────────────────────────────────────────────────

export async function cancelTransactionCode(id: string): Promise<void> {
  const supabase = createClient();
  const {error} = await supabase
    .from("transaction_codes")
    .update({status: "cancelled"})
    .eq("id", id);
  if (error) throw error;
}

export async function cancelAccessCode(id: string): Promise<void> {
  const supabase = createClient();
  const {error} = await supabase.from("access_codes").update({status: "cancelled"}).eq("id", id);
  if (error) throw error;
}

// ── Admin fetch ───────────────────────────────────────────────────────

export async function fetchAllAccessCodes(): Promise<AccessCode[]> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("access_codes")
    .select(
      `
      *,
      profile:profiles!user_id(full_name)
    `,
    )
    .order("created_at", {ascending: false});

  if (error) throw error;
  return data ?? [];
}

export async function fetchAllTransactionCodes(): Promise<TransactionCode[]> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("transaction_codes")
    .select(
      `
      *,
      profile:profiles!user_id(full_name)
    `,
    )
    .order("created_at", {ascending: false});

  if (error) throw error;
  return data ?? [];
}
// ── Helper ────────────────────────────────────────────────────────────

function generateCode(): string {
  // 6-digit numeric code — easy to type
  return Math.floor(100000 + Math.random() * 900000).toString();
}
