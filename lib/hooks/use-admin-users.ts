"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import type {Profile, Account} from "@/types/database";

export interface UserWithAccounts extends Profile {
  accounts: Account[];
}

interface Options {
  search?: string;
  status?: string;
  kyc?: string;
  page?: number;
}

async function fetchAdminUsers(opts: Options) {
  const params = new URLSearchParams({
    search: opts.search ?? "",
    status: opts.status ?? "all",
    kyc: opts.kyc ?? "all",
    page: String(opts.page ?? 1),
  });
  const res = await fetch(`/api/admin/users?${params}`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json() as Promise<{users: UserWithAccounts[]; total: number}>;
}

async function patchAdminUser(id: string, updates: Partial<Profile>) {
  const res = await fetch(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export function useAdminUsers(opts: Options = {}) {
  const queryClient = useQueryClient();
  const queryKey = ["admin-users", opts]; // ✅ entire opts as key — refetches on any filter change

  const {data, isLoading: loading} = useQuery({
    queryKey,
    queryFn: () => fetchAdminUsers(opts),
    staleTime: 30 * 1000,
  });

  const {mutateAsync: updateUser} = useMutation({
    mutationFn: ({id, updates}: {id: string; updates: Partial<Profile>}) =>
      patchAdminUser(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["admin-users"]});
    },
  });

  return {
    users: data?.users ?? [],
    total: data?.total ?? 0,
    loading,
    updateUser: (id: string, updates: Partial<Profile>) => updateUser({id, updates}),
  };
}
