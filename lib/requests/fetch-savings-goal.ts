// requests/fetch-savings-goal.ts
import {createClient} from "@/lib/supabase/client-with-offline";
import {SavingsGoal} from "@/types/database";

export async function fetchSavingsGoal(userId: string): Promise<SavingsGoal | null> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", {ascending: false})
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
