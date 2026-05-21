// components/chat/minimized-chat.tsx
"use client";

import {MessageCircle, X} from "lucide-react";
import {Button} from "@/components/ui/button";

interface MinimizedChatProps {
  onMaximize: () => void;
  onClose: () => void;
  unreadCount?: number;
}

export function MinimizedChat({onMaximize, onClose, unreadCount = 0}: MinimizedChatProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-2 rounded-full bg-background border border-border shadow-lg p-1.5 pr-3">
        <Button
          onClick={onMaximize}
          className="h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 relative">
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
        <span className="text-sm font-medium">Chat Support</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
