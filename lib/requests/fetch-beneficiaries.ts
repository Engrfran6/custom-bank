import {createClient} from "@/lib/supabase/client-with-offline";
import type {Beneficiary} from "@/types/database";

export async function fetchBeneficiaries(userId: string): Promise<Beneficiary[]> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("beneficiaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {ascending: false});

  if (error) throw error;
  return data ?? [];
}
