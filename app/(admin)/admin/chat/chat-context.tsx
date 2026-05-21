"use client";

import {createContext, useContext, useRef, useState} from "react";
import {ChatConversation} from "@/types/database";
import {format} from "date-fns";
import {useAdminChat} from "@/lib/hooks/use-admin-chat";

type AdminChatContextType = ReturnType<typeof useAdminChat> & {
  input: string;
  setInput: (v: string) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  filterStatus: "all" | "active" | "resolved";
  setFilterStatus: (v: "all" | "active" | "resolved") => void;
  showResolveDialog: boolean;
  setShowResolveDialog: (v: boolean) => void;
  showArchiveDialog: boolean;
  setShowArchiveDialog: (v: boolean) => void;
  mobileView: "list" | "chat";
  setMobileView: (v: "list" | "chat") => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  filteredConversations: ChatConversation[];
  handleSend: () => Promise<void>;
  handleKeyPress: (e: React.KeyboardEvent) => void;
  handleSelectConversation: (conv: ChatConversation) => Promise<void>;
  formatMessageTime: (timestamp: string) => string;
  getInitials: (name: string) => string;
};

const AdminChatContext = createContext<AdminChatContextType | null>(null);

export function AdminChatProvider({children}: {children: React.ReactNode}) {
  const chat = useAdminChat();
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "resolved">("active");
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredConversations = chat.conversations.filter((conv) => {
    const matchesSearch =
      conv.user?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || conv.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSend = async () => {
    if (!input.trim() || chat.sending) return;
    await chat.sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectConversation = async (conv: ChatConversation) => {
    await chat.selectConversation(conv);
    setMobileView("chat");
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const diffHours = (Date.now() - date.getTime()) / (1000 * 60 * 60);
    return diffHours < 24 ? format(date, "h:mm a") : format(date, "MMM d, h:mm a");
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  return (
    <AdminChatContext.Provider
      value={{
        ...chat,
        input,
        setInput,
        searchQuery,
        setSearchQuery,
        filterStatus,
        setFilterStatus,
        showResolveDialog,
        setShowResolveDialog,
        showArchiveDialog,
        setShowArchiveDialog,
        mobileView,
        setMobileView,
        inputRef,
        filteredConversations,
        handleSend,
        handleKeyPress,
        handleSelectConversation,
        formatMessageTime,
        getInitials,
      }}>
      {children}
    </AdminChatContext.Provider>
  );
}

export function useAdminChatContext() {
  const ctx = useContext(AdminChatContext);
  if (!ctx) throw new Error("useAdminChatContext must be used within AdminChatProvider");
  return ctx;
}
