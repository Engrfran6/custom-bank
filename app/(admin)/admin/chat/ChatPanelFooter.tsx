"use client";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Loader2, Send, Smile, Paperclip, Shield} from "lucide-react";
import {RefObject} from "react";

interface ChatPanelFooterProps {
  sending: boolean;
  input: string;
  setInput: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  handleSend: () => void;
  handleKeyPress: (e: React.KeyboardEvent) => void;
}

export function ChatPanelFooter({
  sending,
  input,
  setInput,
  inputRef,
  handleSend,
  handleKeyPress,
}: ChatPanelFooterProps) {
  return (
    <div className="shrink-0 border-t bg-background">
      {sending && (
        <div className="px-4 pt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Sending...
        </div>
      )}
      <div className="p-3 md:p-4 space-y-2">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6">
              <Smile className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <Button onClick={handleSend} disabled={!input.trim() || sending} size="icon">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
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
    </div>
  );
}
