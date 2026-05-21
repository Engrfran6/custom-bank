"use client";

import {useEffect, useRef} from "react";
import {createClient} from "@/lib/supabase/client-with-offline";
import type {RealtimeChannel} from "@supabase/supabase-js";

// One channel per userId — same registry pattern
const channelRegistry = new Map<string, RealtimeChannel>();
const listenerRegistry = new Map<string, Set<() => void>>();

export function useRealtimeTransactions(userId: string | null, onChange: () => void) {
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!userId) return;

    if (!listenerRegistry.has(userId)) {
      listenerRegistry.set(userId, new Set());
    }
    const listeners = listenerRegistry.get(userId)!;
    const listener = () => onChangeRef.current();
    listeners.add(listener);

    if (!channelRegistry.has(userId)) {
      const supabase = createClient();
      const channel = supabase
        .channel(`transactions_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "transactions",
            filter: `initiated_by=eq.${userId}`,
          },
          () => listeners.forEach((fn) => fn()),
        )
        .subscribe();

      channelRegistry.set(userId, channel);
    }

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        const channel = channelRegistry.get(userId);
        if (channel) {
          createClient().removeChannel(channel);
          channelRegistry.delete(userId);
          listenerRegistry.delete(userId);
        }
      }
    };
  }, [userId]);
}
