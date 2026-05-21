import {createClient} from "@/lib/supabase/client-with-offline";
import type {Account} from "@/types/database";

export async function fetchAccounts(userId: string): Promise<Account[]> {
  const supabase = createClient();

  const {data, error} = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", {ascending: true});

  if (error) throw error;
  return data ?? [];
}
