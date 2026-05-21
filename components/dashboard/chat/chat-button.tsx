// components/chat/chat-button.tsx
"use client";

import {MessageCircle} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import {ChatSheet} from "./chat-sheet";
import {useChatContext} from "@/lib/context/chat-context";

export function ChatButton() {
  const {isOpen, setIsOpen, toggleChat, unreadCount} = useChatContext();

  return (
    <>
      <button
        onClick={toggleChat}
        className={cn(
          "bottom-15 right-1 md:-right-1 z-99",
          "absolute flex h-14 w-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:bg-primary/90 hover:scale-110",
          "transition-all duration-200 active:scale-95",
          "focus:outline-none focus:ring-2 focus:ring-primary/50",
          isOpen && "hidden",
        )}>
        <MessageCircle className="h-6 w-6 scale-x-[-1]" />

        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-1 -right-1 flex items-center justify-center",
              "min-w-[20px] h-5 px-1 rounded-full",
              "bg-red-500 text-white text-[11px] font-semibold leading-none",
              "ring-2 ring-background",
              "animate-in zoom-in-75 duration-200",
            )}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <ChatSheet open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
