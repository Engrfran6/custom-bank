import {createClient} from "@/lib/supabase/client-with-offline";
import type {BillPayment} from "@/types/database";

export async function fetchBillHistory(userId: string): Promise<BillPayment[]> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("bill_payments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {ascending: false});

  if (error) throw error;
  return data ?? [];
}
