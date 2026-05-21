"use client";

import {AdminChatProvider, useAdminChatContext} from "./chat-context";
import ConversationSidebar from "./conversation-sidebar";
import {ChatPanelHeader} from "./ChatPanelHeader";
import {ChatPanelFooter} from "./ChatPanelFooter";
import {MessageCircle} from "lucide-react";

function AdminChatShell({children}: {children: React.ReactNode}) {
  const {
    conversations,
    selectedConversation,
    loading,
    searchQuery,
    setSearchQuery,
    setFilterStatus,
    filteredConversations,
    mobileView,
    setMobileView,
    getInitials,
    handleSelectConversation,
    input,
    setInput,
    inputRef,
    sending,
    handleSend,
    handleKeyPress,
    setShowResolveDialog,
    setShowArchiveDialog,
  } = useAdminChatContext();

  return (
    // ✅ outer container: fixed height, no overflow
    <div className="flex h-full overflow-hidden bg-background">
      <ConversationSidebar
        mobileView={mobileView}
        conversations={conversations}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        loading={loading}
        filteredConversations={filteredConversations}
        handleSelectConversation={handleSelectConversation}
        selectedConversation={selectedConversation}
        getInitials={getInitials}
        setFilterStatus={setFilterStatus}
      />

      {/* ✅ right panel: full height, column flex, no overflow on itself */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {selectedConversation ? (
          <>
            {/* header: fixed, never scrolls */}
            <div className="flex-shrink-0">
              <ChatPanelHeader
                selectedConversation={selectedConversation}
                setMobileView={setMobileView}
                getInitials={getInitials}
                setShowResolveDialog={setShowResolveDialog}
                setShowArchiveDialog={setShowArchiveDialog}
              />
            </div>

            {/* ✅ children: takes remaining space, scrolls */}
            <main className="flex-1 overflow-y-auto min-h-0">{children}</main>

            {/* footer: fixed, never scrolls */}
            <div className="flex-shrink-0">
              <ChatPanelFooter
                sending={sending}
                input={input}
                setInput={setInput}
                inputRef={inputRef}
                handleSend={handleSend}
                handleKeyPress={handleKeyPress}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-1">No conversation selected</h3>
              <p className="text-sm text-muted-foreground">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminChatLayout({children}: {children: React.ReactNode}) {
  return (
    <AdminChatProvider>
      <AdminChatShell>{children}</AdminChatShell>
    </AdminChatProvider>
  );
}
