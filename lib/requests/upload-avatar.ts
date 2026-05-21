import {createClient} from "@/lib/supabase/client-with-offline";

export interface AvatarUploadResult {
  publicUrl: string;
}

export async function uploadAvatar(userId: string, file: File): Promise<AvatarUploadResult> {
  const supabase = createClient();

  // Sanitize filename — no random(), use timestamp + userId for uniqueness
  const fileExt = file.name.split(".").pop()?.toLowerCase();
  const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

  // 1. Upload to storage
  const {error: uploadError} = await supabase.storage
    .from("avatars")
    .upload(filePath, file, {upsert: true}); // upsert: true — replaces existing

  if (uploadError) throw uploadError;

  // 2. Get public URL
  const {
    data: {publicUrl},
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // 3. Update profile record
  const {error: updateError} = await supabase
    .from("profiles")
    .update({avatar_url: publicUrl})
    .eq("id", userId);

  if (updateError) throw updateError;

  return {publicUrl};
}
