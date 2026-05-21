import {createClient} from "@/lib/supabase/client-with-offline";
import type {Report} from "@/types/database";

type ReportPayload = Omit<
  Report,
  | "id"
  | "user_id"
  | "reference"
  | "status"
  | "admin_notes"
  | "resolved_at"
  | "created_at"
  | "updated_at"
>;

export async function fetchReports(userId: string): Promise<Report[]> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {ascending: false});

  if (error) throw error;
  return data ?? [];
}

export async function insertReport(userId: string, payload: ReportPayload): Promise<void> {
  const supabase = createClient();
  const {error} = await supabase.from("reports").insert({...payload, user_id: userId});

  if (error) throw error;
}
