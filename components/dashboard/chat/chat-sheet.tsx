"use client";

import {useState, useRef, useEffect} from "react";
import {
  X,
  Send,
  Minus,
  Maximize2,
  User,
  Shield,
  CheckCheck,
  Clock,
  Smile,
  Paperclip,
  Loader2,
  MessageCircle,
} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import {useChat} from "@/lib/hooks/use-chat";
import {Button} from "@/components/ui/button";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {ScrollArea} from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {format} from "date-fns";

interface ChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatSheet({open, onOpenChange}: ChatSheetProps) {
  const [input, setInput] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const {messages, loading, sending, sendMessage, messagesEndRef, isAdmin} = useChat();

  // Notify hook whenever open state changes so it can mark messages read
  // useEffect(() => {
  //   onChatOpenChange(open && !isMinimized);
  // }, [open, isMinimized, onChatOpenChange]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    await sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    if (diffHours < 24) return format(date, "h:mm a");
    return format(date, "MMM d, h:mm a");
  };

  return (
    <Sheet open={open && !isMinimized} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "p-0 w-full sm:max-w-[400px] flex flex-col h-[100dvh] overflow-hidden",
          isExpanded && "sm:max-w-[600px]",
        )}>
        {/* Header */}
        <SheetHeader className="flex flex-row items-center justify-between p-4 border-b sticky top-0 bg-background z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src="/images/support-avatar.png" />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {isAdmin ? <Shield className="h-5 w-5" /> : <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background animate-pulse" />
            </div>
            <div>
              <SheetTitle className="text-base">
                {isAdmin ? "Customer Support" : "Chat Support"}
              </SheetTitle>
              <SheetDescription className="text-xs flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                Usually replies in a few minutes
              </SheetDescription>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsExpanded(!isExpanded)}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMinimized(true)}>
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </SheetHeader>

        {/* Messages Area */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="flex-1 min-h-0 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
                    <MessageCircle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">Start a conversation</h3>
                  <p className="text-sm text-muted-foreground">
                    {isAdmin
                      ? "Customer messages will appear here"
                      : "Send a message to our support team. We're here to help!"}
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isOwnMessage = isAdmin
                  ? msg.sender_type === "admin"
                  : msg.sender_type === "user";
                const showAvatar =
                  !isOwnMessage &&
                  (idx === 0 || messages[idx - 1]?.sender_type !== msg.sender_type);

                return (
                  <div key={msg.id} className={cn("flex gap-2", isOwnMessage && "justify-end")}>
                    {!isOwnMessage && showAvatar && (
                      <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {isAdmin ? "AD" : "SU"}
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
                          {isAdmin ? "AD" : "YO"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        )}

        {/* Input Area */}
        <div className="border-t p-4 space-y-3 bg-background shrink-0">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sending}
                className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6">
                <Smile className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              size="icon"
              className="h-9 w-9">
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Paperclip className="h-3 w-3" />
              </Button>
              <span>Attach files (max 10MB)</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              <span>End-to-end encrypted</span>
            </div>
          </div>
        </div>

        {/* Sending indicator */}
        {sending && (
          <div className="border-t p-2 bg-muted/30 shrink-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sending...
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
