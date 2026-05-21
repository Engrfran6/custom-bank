"use client";

import {ChatPanelBody} from "./ChatPanelBody";
import {useAdminChatContext} from "./chat-context";

export default function AdminChatPage() {
  const {
    selectedConversation,
    messages,
    messagesLoading,
    getInitials,
    formatMessageTime,
    messagesEndRef,
  } = useAdminChatContext();

  if (!selectedConversation) return null;

  return (
    <ChatPanelBody
      selectedConversation={selectedConversation}
      messages={messages}
      messagesLoading={messagesLoading}
      getInitials={getInitials}
      formatMessageTime={formatMessageTime}
      messagesEndRef={messagesEndRef}
    />
  );
}
