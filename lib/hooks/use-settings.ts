"use client";

import {useMutation, useQueryClient} from "@tanstack/react-query";
import type {Profile} from "@/types/database";

// API route — co-located fetch functions, no requests/ needed

async function patchProfile(data: Profile) {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({type: "profile", ...data}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json;
}

async function patchPassword(data: {current_password: string; new_password: string}) {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({type: "password", ...data}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error);
  return json;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  const {
    mutate: update,
    isPending: loading,
    error,
    isSuccess: success,
  } = useMutation({
    mutationFn: patchProfile,
    onSuccess: (_, variables) => {
      // Patch profile cache directly so UI updates instantly
      queryClient.setQueryData<Profile>(["profile", variables.id], (prev) =>
        prev ? {...prev, ...variables} : prev,
      );
    },
  });

  return {
    update,
    loading,
    error: error?.message ?? null,
    success,
  };
}

export function useUpdatePassword() {
  const {
    mutate: update,
    isPending: loading,
    error,
    isSuccess: success,
  } = useMutation({
    mutationFn: patchPassword,
    // No cache to invalidate as password change should not have cached state
  });

  return {
    update,
    loading,
    error: error?.message ?? null,
    success,
  };
}
