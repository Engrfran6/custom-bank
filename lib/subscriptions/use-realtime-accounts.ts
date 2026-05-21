// subscriptions/use-realtime-accounts.ts
"use client";

import {useEffect, useRef} from "react";
import {createClient} from "@/lib/supabase/client-with-offline";
import type {Account} from "@/types/database";
import type {RealtimeChannel} from "@supabase/supabase-js";

interface AccountsCallbacks {
  onInsert: (account: Account) => void;
  onUpdate: (account: Account) => void;
  onDelete: (id: string) => void;
}

const channelRegistry = new Map<string, RealtimeChannel>();
const listenerRegistry = new Map<string, Set<AccountsCallbacks>>();

export function useRealtimeAccounts(
  userId: string | null,
  accountIds: string[], // ✅ pass the user's own account IDs
  callbacks: AccountsCallbacks,
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!userId || accountIds.length === 0) return;

    const key = userId;

    if (!listenerRegistry.has(key)) {
      listenerRegistry.set(key, new Set());
    }
    const listeners = listenerRegistry.get(key)!;
    const entry: AccountsCallbacks = {
      onInsert: (a) => callbacksRef.current.onInsert(a),
      onUpdate: (a) => callbacksRef.current.onUpdate(a),
      onDelete: (id) => callbacksRef.current.onDelete(id),
    };
    listeners.add(entry);

    if (!channelRegistry.has(key)) {
      const supabase = createClient();

      const channel = supabase
        .channel(`accounts_${userId}`)
        .on(
          "postgres_changes",
          // ✅ Listen on ALL account updates, filter client-side by accountIds
          // Supabase realtime filter doesn't support OR, so we listen broadly
          // and filter in the callback
          {event: "UPDATE", schema: "public", table: "accounts"},
          (payload) => {
            const updated = payload.new as Account;
            // ✅ Only process if this account belongs to this user
            if (accountIds.includes(updated.id)) {
              listeners.forEach((l) => l.onUpdate(updated));
            }
          },
        )
        .on(
          "postgres_changes",
          {event: "INSERT", schema: "public", table: "accounts", filter: `user_id=eq.${userId}`},
          (payload) => {
            listeners.forEach((l) => l.onInsert(payload.new as Account));
          },
        )
        .on(
          "postgres_changes",
          {event: "DELETE", schema: "public", table: "accounts", filter: `user_id=eq.${userId}`},
          (payload) => {
            listeners.forEach((l) => l.onDelete(payload.old.id as string));
          },
        )
        .subscribe();

      channelRegistry.set(key, channel);
    }

    return () => {
      listeners.delete(entry);
      if (listeners.size === 0) {
        const channel = channelRegistry.get(key);
        if (channel) {
          createClient().removeChannel(channel);
          channelRegistry.delete(key);
          listenerRegistry.delete(key);
        }
      }
    };
  }, [userId, accountIds]); // re-subscribe if accountIds change
}
