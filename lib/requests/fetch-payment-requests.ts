import {createClient} from "@/lib/supabase/client-with-offline";
import type {PaymentRequest, PaymentDetails, UniversalPaymentDetails} from "@/types/database";

export async function fetchPaymentRequests(): Promise<PaymentRequest[]> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("payment_requests")
    .select("*")
    .order("created_at", {ascending: false});
  if (error) throw error;
  return data ?? [];
}

export async function fetchUniversalPaymentDetails(): Promise<UniversalPaymentDetails | null> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("universal_payment_details")
    .select("*")
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

export async function fetchPaymentDetails(requestId: string): Promise<PaymentDetails | null> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("payment_details")
    .select("*")
    .eq("payment_request_id", requestId)
    .single();
  if (error) return null;
  return data;
}

export async function upsertPaymentDetails(
  payload: Partial<PaymentDetails> & {payment_request_id: string},
): Promise<void> {
  const supabase = createClient();
  const {error} = await supabase.from("payment_details").upsert({
    ...payload,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function upsertUniversalPaymentDetails(
  payload: Partial<UniversalPaymentDetails>,
): Promise<void> {
  const supabase = createClient();
  const {
    data: {user},
  } = await createClient().auth.getUser();
  const {error} = await supabase.from("universal_payment_details").upsert({
    ...payload,
    updated_at: new Date().toISOString(),
    updated_by: user?.id,
  });
  if (error) throw error;
}

export async function insertPaymentRequest(
  payload: Omit<PaymentRequest, "id" | "created_at" | "updated_at">,
): Promise<PaymentRequest> {
  const supabase = createClient();
  const {data, error} = await supabase.from("payment_requests").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function patchPaymentRequestStatus(
  id: string,
  status: PaymentRequest["status"],
): Promise<void> {
  const supabase = createClient();
  const updateData: {status: PaymentRequest["status"]; paid_at?: string} = {status};
  if (status === "paid") updateData.paid_at = new Date().toISOString();
  const {error} = await supabase.from("payment_requests").update(updateData).eq("id", id);
  if (error) throw error;
}
