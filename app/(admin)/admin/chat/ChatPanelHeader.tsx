"use client";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {
  ArrowLeft,
  Mail,
  Phone,
  Video,
  MoreVertical,
  CheckCircle2,
  Archive,
  Flag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {TooltipProvider, Tooltip, TooltipTrigger, TooltipContent} from "@/components/ui/tooltip";
import {ChatConversation} from "@/types/database";

interface ChatPanelHeaderProps {
  selectedConversation: ChatConversation;
  setMobileView: (view: "list" | "chat") => void;
  getInitials: (name: string) => string;
  setShowResolveDialog: (show: boolean) => void;
  setShowArchiveDialog: (show: boolean) => void;
}

export function ChatPanelHeader({
  selectedConversation,
  setMobileView,
  getInitials,
  setShowResolveDialog,
  setShowArchiveDialog,
}: ChatPanelHeaderProps) {
  return (
    <div className="shrink-0 flex items-center justify-between p-3 md:p-4 border-b bg-background z-10">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 md:hidden"
          onClick={() => setMobileView("list")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={selectedConversation.user?.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials(
              selectedConversation.user?.full_name || selectedConversation.user?.email || "User",
            )}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">
              {selectedConversation.user?.full_name ||
                selectedConversation.user?.email?.split("@")[0] ||
                "Customer"}
            </h3>
            <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Active
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{selectedConversation.user?.email}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:inline-flex">
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start voice call</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:inline-flex">
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start video call</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowResolveDialog(true)}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Resolved
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowArchiveDialog(true)}>
              <Archive className="h-4 w-4 mr-2" />
              Archive Conversation
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Flag className="h-4 w-4 mr-2" />
              Report Issue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
