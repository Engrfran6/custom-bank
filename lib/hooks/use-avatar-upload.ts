"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import {uploadAvatar} from "../requests/upload-avatar";
import type {Profile} from "@/types/database";

export function useAvatarUpload(userId: string) {
  const queryClient = useQueryClient();

  const {mutateAsync, isPending, error, reset} = useMutation({
    mutationFn: (file: File) => uploadAvatar(userId, file),

    onSuccess: ({publicUrl}) => {
      // ✅ Patch the profile cache directly — no refetch needed
      queryClient.setQueryData<Profile>(["profile", userId], (prev) => {
        if (!prev) return prev;
        return {...prev, avatar_url: publicUrl};
      });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await mutateAsync(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return {
    handleFileChange,
    uploading: isPending,
    error: error?.message ?? null,
    reset,
  };
}
