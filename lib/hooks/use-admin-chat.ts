"use client";

import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";
import {useState, useCallback, useRef, useEffect} from "react";
import {useToast} from "@/components/ui/use-toast";
import {createClient} from "../supabase/client-with-offline";
import type {RealtimeChannel} from "@supabase/supabase-js";
import {playNotificationSound} from "../utils/notification-sound";
import {ChatConversation, ChatMessage} from "@/types/database";

const AUTO_MESSAGE =
  "👋 Thanks for reaching out! An admin will be with you shortly. Please hold on — we're reviewing your conversation now.";

const autoMessageSent = new Set<string>();

// ── API functions (co-located — all API routes, no requests/ needed) ──

async function fetchConversations(): Promise<ChatConversation[]> {
  const res = await fetch("/api/admin/chat/conversations?status=active");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data.conversations ?? data ?? [];
}

async function fetchMessages(conversationId: string): Promise<ChatMessage[]> {
  const res = await fetch(`/api/admin/chat/conversations/${conversationId}/messages`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.messages ?? [];
}

async function postMessage(conversationId: string, message: string): Promise<ChatMessage> {
  const res = await fetch(`/api/admin/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({message}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data.message;
}

async function patchConversationStatus(conversationId: string, status: string) {
  const res = await fetch(`/api/admin/chat/conversations/${conversationId}`, {
    method: "PATCH",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({status}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

export function useAdminChat() {
  const {toast} = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const subscriptionRef = useRef<RealtimeChannel | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Queries ───────────────────────────────────────────────────────────

  const {data: conversations = [], isLoading: loading} = useQuery({
    queryKey: ["admin-conversations"],
    queryFn: fetchConversations,
    staleTime: 30 * 1000,
  });

  const {data: messages = [], isLoading: messagesLoading} = useQuery({
    queryKey: ["admin-messages", selectedConversation?.id],
    queryFn: () => fetchMessages(selectedConversation!.id),
    enabled: !!selectedConversation?.id,
    staleTime: 0, // always fresh — realtime patches the cache
  });

  // ── Mutations ─────────────────────────────────────────────────────────

  const {mutateAsync: sendMessage, isPending: sending} = useMutation({
    mutationFn: ({message}: {message: string}) => postMessage(selectedConversation!.id, message),

    onSuccess: (newMessage) => {
      // Patch messages cache directly — no refetch
      queryClient.setQueryData<ChatMessage[]>(
        ["admin-messages", selectedConversation?.id],
        (prev) => {
          if (!prev) return [newMessage];
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        },
      );
      // Update last_message in conversations list
      queryClient.setQueryData<ChatConversation[]>(
        ["admin-conversations"],
        (prev) =>
          prev?.map((conv) =>
            conv.id === selectedConversation?.id
              ? {
                  ...conv,
                  last_message: newMessage.message,
                  last_message_time: new Date().toISOString(),
                }
              : conv,
          ) ?? [],
      );
    },

    onError: () => {
      toast({title: "Error", description: "Failed to send message", variant: "destructive"});
    },
  });

  const {mutateAsync: resolveConversation} = useMutation({
    mutationFn: (conversationId: string) => patchConversationStatus(conversationId, "resolved"),
    onSuccess: (_, conversationId) => {
      queryClient.setQueryData<ChatConversation[]>(
        ["admin-conversations"],
        (prev) => prev?.filter((conv) => conv.id !== conversationId) ?? [],
      );
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        queryClient.removeQueries({queryKey: ["admin-messages", conversationId]});
      }
      toast({title: "Conversation resolved", description: "The chat has been marked as resolved"});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to resolve conversation",
        variant: "destructive",
      });
    },
  });

  const {mutateAsync: archiveConversation} = useMutation({
    mutationFn: (conversationId: string) => patchConversationStatus(conversationId, "archived"),
    onSuccess: (_, conversationId) => {
      queryClient.setQueryData<ChatConversation[]>(
        ["admin-conversations"],
        (prev) => prev?.filter((conv) => conv.id !== conversationId) ?? [],
      );
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        queryClient.removeQueries({queryKey: ["admin-messages", conversationId]});
      }
      toast({title: "Conversation archived", description: "The chat has been archived"});
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to archive conversation",
        variant: "destructive",
      });
    },
  });

  // ── Realtime subscription — stays manual, not a TQ concern ───────────

  const subscribeToMessages = useCallback(
    (conversationId: string) => {
      const supabase = createClient();

      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      const channel = supabase
        .channel(`admin_chat_${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMessage = payload.new as ChatMessage;

            // Patch TQ cache directly from realtime event
            queryClient.setQueryData<ChatMessage[]>(["admin-messages", conversationId], (prev) => {
              if (!prev) return [newMessage];
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });

            if (newMessage.sender_type === "user") {
              playNotificationSound();
              toast({
                title: "New message from customer",
                description: newMessage.message.slice(0, 50),
                duration: 5000,
              });
              // Update unread count + last message in conversations list
              queryClient.setQueryData<ChatConversation[]>(
                ["admin-conversations"],
                (prev) =>
                  prev?.map((conv) =>
                    conv.id === conversationId
                      ? {
                          ...conv,
                          last_message: newMessage.message,
                          last_message_time: newMessage.created_at,
                          unread_count: (conv.unread_count ?? 0) + 1,
                        }
                      : conv,
                  ) ?? [],
              );
            } else {
              queryClient.setQueryData<ChatConversation[]>(
                ["admin-conversations"],
                (prev) =>
                  prev?.map((conv) =>
                    conv.id === conversationId
                      ? {
                          ...conv,
                          last_message: newMessage.message,
                          last_message_time: newMessage.created_at,
                        }
                      : conv,
                  ) ?? [],
              );
            }
          },
        )
        .subscribe();

      subscriptionRef.current = channel;
    },
    [queryClient, toast],
  );

  // ── Auto-message — stays manual, fire-once side effect ───────────────

  const sendAutoMessage = useCallback(
    async (conversationId: string) => {
      if (autoMessageSent.has(conversationId)) return;
      autoMessageSent.add(conversationId);

      try {
        const newMessage = await postMessage(conversationId, AUTO_MESSAGE);
        queryClient.setQueryData<ChatMessage[]>(["admin-messages", conversationId], (prev) => {
          if (!prev) return [newMessage];
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      } catch {
        autoMessageSent.delete(conversationId);
      }
    },
    [queryClient],
  );

  // ── Select conversation ───────────────────────────────────────────────

  const selectConversation = useCallback(
    async (conversation: ChatConversation) => {
      setSelectedConversation(conversation);
      subscribeToMessages(conversation.id);

      // Mark unread count as 0 in conversations list
      queryClient.setQueryData<ChatConversation[]>(
        ["admin-conversations"],
        (prev) =>
          prev?.map((conv) => (conv.id === conversation.id ? {...conv, unread_count: 0} : conv)) ??
          [],
      );

      // Send auto-message only if conversation has no messages
      const cached = queryClient.getQueryData<ChatMessage[]>(["admin-messages", conversation.id]);
      if (!cached || cached.length === 0) {
        // Let useQuery fetch first, then check
        await queryClient.fetchQuery({
          queryKey: ["admin-messages", conversation.id],
          queryFn: () => fetchMessages(conversation.id),
        });
        const fetched = queryClient.getQueryData<ChatMessage[]>([
          "admin-messages",
          conversation.id,
        ]);
        if (!fetched || fetched.length === 0) {
          await sendAutoMessage(conversation.id);
        }
      }
    },
    [queryClient, subscribeToMessages, sendAutoMessage],
  );

  // ── Auto-scroll — stays manual, DOM side effect ───────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
  }, [messages]);

  // ── Cleanup subscription on unmount ──────────────────────────────────

  useEffect(() => {
    const supabase = createClient();
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, []);

  return {
    conversations,
    selectedConversation,
    messages,
    loading,
    messagesLoading,
    sending,
    sendMessage: (message: string) => sendMessage({message}),
    selectConversation,
    resolveConversation,
    archiveConversation,
    messagesEndRef,
  };
}
