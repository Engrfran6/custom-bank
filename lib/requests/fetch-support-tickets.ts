import {createClient} from "@/lib/supabase/client-with-offline";
import type {SupportTicket} from "@/types/database";

export async function fetchSupportTickets(userId: string): Promise<SupportTicket[]> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {ascending: false});

  if (error) throw error;
  return data ?? [];
}

export async function insertSupportTicket(
  userId: string,
  payload: Pick<SupportTicket, "subject" | "category" | "priority" | "message">,
): Promise<void> {
  const supabase = createClient();
  const {error} = await supabase.from("support_tickets").insert({...payload, user_id: userId});

  if (error) throw error;
}
