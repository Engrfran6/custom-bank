"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {useRef, useEffect} from "react";
import {useToast} from "@/components/ui/use-toast";
import {useProfile} from "./use-profile";
import {createClient} from "@/lib/supabase/client-with-offline";
import {playNotificationSound} from "../utils/notification-sound";
import {useChatContext} from "../context/chat-context";
import type {RealtimeChannel} from "@supabase/supabase-js";
import {ChatConversation, ChatMessage} from "@/types/database";

async function getOrCreateConversation(userId: string): Promise<ChatConversation> {
  const supabase = createClient();

  const {data: existing, error: fetchError} = await supabase
    .from("chat_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", {ascending: false})
    .limit(1)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return existing;

  const {data: created, error: createError} = await supabase
    .from("chat_conversations")
    .insert({user_id: userId, admin_id: null, status: "active"})
    .select()
    .single();

  if (createError) throw createError;
  return created;
}

async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const supabase = createClient();
  const {data, error} = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", {ascending: true});

  if (error) throw error;
  return data ?? [];
}

async function insertMessage(params: {
  conversationId: string;
  senderId: string;
  senderType: "user" | "admin";
  message: string;
}): Promise<ChatMessage> {
  const supabase = createClient();

  const {data, error} = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: params.conversationId,
      sender_id: params.senderId,
      sender_type: params.senderType,
      message: params.message.trim(),
      is_read: false,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("chat_conversations")
    .update({updated_at: new Date().toISOString()})
    .eq("id", params.conversationId);

  return data;
}

export function useChat() {
  const {user, profile} = useProfile();
  const {toast} = useToast();
  const {isOpen, setUnreadCount} = useChatContext();
  const queryClient = useQueryClient();
  const isAdmin = profile?.role === "admin";

  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);

  // Keep ref in sync — realtime callback needs current open state
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // ── Conversation init — stays manual (side-effectful, not pure fetch) ─

  const {data: conversation} = useQuery({
    queryKey: ["chat-conversation", user?.id],
    queryFn: () => getOrCreateConversation(user!.id),
    enabled: !!user?.id,
    staleTime: Infinity, // conversation doesn't change once created
  });

  // ── Messages ──────────────────────────────────────────────────────────

  const {data: messages = [], isLoading: loading} = useQuery({
    queryKey: ["chat-messages", conversation?.id],
    queryFn: async () => {
      const msgs = await fetchMessages(conversation!.id);

      // Mark unread on load — side effect inside queryFn is acceptable here
      // since it's tightly coupled to the fetch result
      const supabase = createClient();
      const unread = msgs.filter((m) =>
        isAdmin ? m.sender_type === "user" && !m.is_read : m.sender_type === "admin" && !m.is_read,
      );

      if (!isAdmin) setUnreadCount(unread.length);

      if (unread.length > 0 && (isAdmin || isOpenRef.current)) {
        await supabase
          .from("chat_messages")
          .update({is_read: true})
          .in(
            "id",
            unread.map((m) => m.id),
          );

        if (!isAdmin) setUnreadCount(0);
      }

      return msgs;
    },
    enabled: !!conversation?.id,
    staleTime: 0,
  });

  // ── Send message mutation ─────────────────────────────────────────────

  const {mutateAsync: sendMessage, isPending: sending} = useMutation({
    mutationFn: (messageText: string) =>
      insertMessage({
        conversationId: conversation!.id,
        senderId: user!.id,
        senderType: isAdmin ? "admin" : "user",
        message: messageText,
      }),

    onSuccess: (newMessage) => {
      queryClient.setQueryData<ChatMessage[]>(["chat-messages", conversation?.id], (prev) => {
        if (!prev) return [newMessage];
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    },

    onError: () => {
      toast({title: "Error", description: "Failed to send message", variant: "destructive"});
    },
  });

  // ── Realtime subscription — stays manual ──────────────────────────────

  useEffect(() => {
    if (!conversation?.id) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`chat_${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;

          queryClient.setQueryData<ChatMessage[]>(["chat-messages", conversation.id], (prev) => {
            if (!prev) return [newMessage];
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          const isIncoming = isAdmin
            ? newMessage.sender_type === "user"
            : newMessage.sender_type === "admin";

          if (!isIncoming) return;

          if (!isAdmin) {
            if (isOpenRef.current) {
              supabase
                .from("chat_messages")
                .update({is_read: true})
                .eq("id", newMessage.id)
                .then(() => {
                  queryClient.setQueryData<ChatMessage[]>(
                    ["chat-messages", conversation.id],
                    (prev) =>
                      prev?.map((m) => (m.id === newMessage.id ? {...m, is_read: true} : m)) ?? [],
                  );
                });
            } else {
              setUnreadCount((c) => c + 1);
              playNotificationSound();
              toast({
                title: "New message",
                description: newMessage.message.slice(0, 50),
                duration: 3000,
              });
            }
          } else {
            playNotificationSound();
            toast({
              title: "New message",
              description: newMessage.message.slice(0, 50),
              duration: 3000,
            });
            supabase.from("chat_messages").update({is_read: true}).eq("id", newMessage.id);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const updated = payload.new as ChatMessage;
          queryClient.setQueryData<ChatMessage[]>(
            ["chat-messages", conversation.id],
            (prev) =>
              prev?.map((m) => (m.id === updated.id ? {...m, is_read: updated.is_read} : m)) ?? [],
          );
        },
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      subscriptionRef.current = null;
    };
  }, [conversation?.id, isAdmin, queryClient, setUnreadCount, toast]);

  // ── Auto-scroll — stays manual, DOM side effect ───────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messages]);

  return {
    messages,
    conversation,
    loading,
    sending,
    sendMessage,
    messagesEndRef,
    isAdmin,
  };
}
