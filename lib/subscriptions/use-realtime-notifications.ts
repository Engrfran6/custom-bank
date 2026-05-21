"use client";

import {useEffect, useRef} from "react";
import {createClient} from "@/lib/supabase/client-with-offline";
import type {Notification} from "@/types/database";

interface NotificationCallbacks {
  onInsert: (n: Notification) => void;
  onUpdate: (n: Notification) => void;
  onDelete: (id: string) => void;
}

export function useRealtimeNotifications(
  enabled: boolean,
  callbacks: NotificationCallbacks,
  userId?: string,
) {
  const callbacksRef = useRef(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }

    const supabase = createClient();
    const channelName = `notifications_${userId}_${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacksRef.current.onInsert(payload.new as Notification);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callbacksRef.current.onUpdate(payload.new as Notification);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("🗑️ DELETE received:", payload);
          callbacksRef.current.onDelete(payload.old.id as string);
        },
      )
      .subscribe((status) => {
        console.log("📡 Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, userId]);
}
