"use client";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Separator} from "@/components/ui/separator";
import {Loader2, CheckCheck, Clock} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import {format} from "date-fns";
import {ChatConversation, ChatMessage} from "@/types/database";
import {RefObject} from "react";

interface ChatPanelBodyProps {
  selectedConversation: ChatConversation;
  messages: ChatMessage[];
  messagesLoading: boolean;
  getInitials: (name: string) => string;
  formatMessageTime: (timestamp: string) => string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatPanelBody({
  selectedConversation,
  messages,
  messagesLoading,
  getInitials,
  formatMessageTime,
  messagesEndRef,
}: ChatPanelBodyProps) {
  if (messagesLoading) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="p-4 space-y-4">
        {messages.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-2 text-muted-foreground">
                {format(new Date(messages[0]?.created_at), "MMMM d, yyyy")}
              </span>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isOwnMessage = msg.sender_type === "admin";
          const showAvatar =
            !isOwnMessage && (idx === 0 || messages[idx - 1]?.sender_id !== msg.sender_id);

          return (
            <div key={msg.id} className={cn("flex gap-2", isOwnMessage && "justify-end")}>
              {!isOwnMessage && showAvatar && (
                <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(selectedConversation.user?.full_name || "U")}
                  </AvatarFallback>
                </Avatar>
              )}
              {!isOwnMessage && !showAvatar && <div className="w-8 shrink-0" />}

              <div className="max-w-[75%]">
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm",
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}>
                  <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <span>{formatMessageTime(msg.created_at)}</span>
                  {isOwnMessage && (
                    <>
                      <span>·</span>
                      {msg.is_read ? (
                        <CheckCheck className="h-2.5 w-2.5 text-primary" />
                      ) : (
                        <Clock className="h-2.5 w-2.5" />
                      )}
                    </>
                  )}
                </div>
              </div>

              {isOwnMessage && (
                <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    AD
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
