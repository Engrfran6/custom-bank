// lib/requests/fetch-user-profile.ts
import {createClient} from "@/lib/supabase/client-with-offline";
import {Profile} from "@/types/database";

export async function fetchUserProfile(userId: string): Promise<Profile> {
  // Check offline status first
  if (!navigator.onLine) {
    throw new Error("offline");
  }

  const supabase = createClient();

  try {
    const {data, error} = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) throw error;
    if (!data) throw new Error("Profile not found");

    return data;
  } catch (error) {
    // Check if it's a network error
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("offline");
    }
    throw error;
  }
}
