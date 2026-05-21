"use client";

import {useEffect, useRef} from "react";
import {createClient} from "../supabase/client-with-offline";
import type {Profile} from "@/types/database";
import type {RealtimeChannel} from "@supabase/supabase-js";

// Global registry — one channel per userId across all hook instances
const channelRegistry = new Map<string, RealtimeChannel>();
const listenerRegistry = new Map<string, Set<(p: Profile) => void>>();

export function useRealtimeProfile(userId: string | null, onUpdate: (profile: Profile) => void) {
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  });

  useEffect(() => {
    if (!userId) return;

    // Register this listener
    if (!listenerRegistry.has(userId)) {
      listenerRegistry.set(userId, new Set());
    }
    const listeners = listenerRegistry.get(userId)!;
    const listener = (p: Profile) => onUpdateRef.current(p);
    listeners.add(listener);

    // Only create the channel once per userId
    if (!channelRegistry.has(userId)) {
      const supabase = createClient();
      const channel = supabase
        .channel(`profile_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${userId}`,
          },
          (payload) => {
            // Broadcast to all registered listeners for this userId
            listenerRegistry.get(userId)?.forEach((fn) => fn(payload.new as Profile));
          },
        )
        .subscribe();

      channelRegistry.set(userId, channel);
    }

    return () => {
      listeners.delete(listener);

      // Only remove channel when no listeners remain
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
