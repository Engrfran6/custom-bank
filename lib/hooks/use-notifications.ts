"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import type {Notification} from "@/types/database";
import {useRealtimeNotifications} from "../subscriptions/use-realtime-notifications";
import {useAuthListener} from "./use-auth-listener";

interface Options {
  filter?: string;
  page?: number;
  realtime?: boolean;
}

interface NotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  total: number;
}

async function fetchNotifications(filter: string, page: number): Promise<NotificationsResult> {
  const params = new URLSearchParams({filter, page: String(page)});
  const res = await fetch(`/api/notifications?${params}`);
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

async function patchNotifications(body: object) {
  const res = await fetch("/api/notifications", {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update notifications");
}

async function deleteNotifications(body: object) {
  const res = await fetch("/api/notifications", {
    method: "DELETE",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to delete notifications");
}

export function useNotifications(opts: Options = {}) {
  const {filter = "all", page = 1, realtime = true} = opts;
  const queryClient = useQueryClient();
  const {user} = useAuthListener(); // ✅ get current user
  const queryKey = ["notifications", filter, page];

  const {data, isLoading: loading} = useQuery<NotificationsResult>({
    queryKey,
    queryFn: () => fetchNotifications(filter, page),
    staleTime: 30 * 1000,
  });

  // ── Realtime — stays manual ───────────────────────────────────────────
  useRealtimeNotifications(
    realtime,
    {
      onInsert: (n) =>
        queryClient.setQueryData<NotificationsResult>(queryKey, (prev) => {
          if (!prev) return prev;
          return {
            notifications: [n, ...prev.notifications],
            unreadCount: prev.unreadCount + 1,
            total: prev.total + 1,
          };
        }),
      onUpdate: (n) =>
        queryClient.setQueryData<NotificationsResult>(queryKey, (prev) => {
          if (!prev) return prev;
          const notifications = prev.notifications.map((x) => (x.id === n.id ? n : x));
          return {
            ...prev,
            notifications,
            unreadCount: notifications.filter((x) => !x.is_read).length,
          };
        }),
      onDelete: (id) =>
        queryClient.setQueryData<NotificationsResult>(queryKey, (prev) => {
          if (!prev) return prev;
          const notifications = prev.notifications.filter((x) => x.id !== id);
          return {
            notifications,
            unreadCount: notifications.filter((x) => !x.is_read).length,
            total: notifications.length,
          };
        }),
    },
    user?.id, // ✅ pass userId
  );

  // ── Mutations ─────────────────────────────────────────────────────────
  const {mutateAsync: markRead} = useMutation({
    mutationFn: (ids: string[]) => patchNotifications({ids}),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<NotificationsResult>(queryKey, (prev) => {
        if (!prev) return prev;
        const notifications = prev.notifications.map((n) =>
          ids.includes(n.id) ? {...n, is_read: true} : n,
        );
        return {
          ...prev,
          notifications,
          unreadCount: notifications.filter((n) => !n.is_read).length,
        };
      });
    },
  });

  const {mutateAsync: markAllRead} = useMutation({
    mutationFn: () => patchNotifications({mark_all: true}),
    onSuccess: () => {
      queryClient.setQueryData<NotificationsResult>(queryKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          notifications: prev.notifications.map((n) => ({...n, is_read: true})),
          unreadCount: 0,
        };
      });
    },
  });

  const {mutateAsync: deleteNotification} = useMutation({
    mutationFn: (ids: string[]) => deleteNotifications({ids}),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<NotificationsResult>(queryKey, (prev) => {
        if (!prev) return prev;
        const notifications = prev.notifications.filter((n) => !ids.includes(n.id));
        return {
          notifications,
          unreadCount: notifications.filter((n) => !n.is_read).length,
          total: notifications.length,
        };
      });
    },
  });

  const {mutateAsync: deleteAll} = useMutation({
    mutationFn: () => deleteNotifications({delete_all: true}),
    onSuccess: () => {
      queryClient.setQueryData<NotificationsResult>(queryKey, () => ({
        notifications: [],
        unreadCount: 0,
        total: 0,
      }));
    },
  });

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    total: data?.total ?? 0,
    loading,
    markRead,
    markAllRead,
    deleteNotification,
    deleteAll,
    reload: () => queryClient.invalidateQueries({queryKey}),
  };
}
