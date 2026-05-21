"use client";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {ScrollArea} from "@/components/ui/scroll-area";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Users, MessageCircle, Search, Filter, Loader2, ArrowLeft} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import {formatDistanceToNow} from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {ChatConversation} from "@/types/database";
import {useRouter} from "next/navigation";

interface ConSidebarProps {
  mobileView: "list" | "chat";
  conversations: ChatConversation[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  loading: boolean;
  filteredConversations: ChatConversation[];
  handleSelectConversation: (conversation: ChatConversation) => void;
  selectedConversation: ChatConversation | null;
  getInitials: (name: string) => string;
  setFilterStatus: (status: "all" | "active" | "resolved") => void;
}

function ConversationSidebar({
  mobileView,
  conversations,
  searchQuery,
  setSearchQuery,
  loading,
  filteredConversations,
  handleSelectConversation,
  selectedConversation,
  getInitials,
  setFilterStatus,
}: ConSidebarProps) {
  const router = useRouter();
  return (
    <div
      className={cn(
        "md:flex md:w-80 md:border-r md:flex-col md:h-full shrink-0",
        "flex flex-col w-full h-full",
        mobileView === "chat" ? "hidden md:flex" : "flex",
      )}>
      <div className="p-4 border-b space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 md:hidden"
              onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Users className="h-4 w-4 text-primary" />
            Conversations
            <Badge variant="secondary" className="ml-1">
              {conversations.length}
            </Badge>
          </h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                All Conversations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("active")}>
                Active Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("resolved")}>
                Resolved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MessageCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No conversations found</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all",
                  "hover:bg-muted/50 active:scale-[0.98]",
                  selectedConversation?.id === conv.id && "bg-muted",
                )}>
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={conv.user?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(conv.user?.full_name || conv.user?.email || "User")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">
                      {conv.user?.full_name || conv.user?.email?.split("@")[0] || "Customer"}
                    </p>
                    {conv.last_message_time && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatDistanceToNow(new Date(conv.last_message_time), {addSuffix: true})}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.last_message || "No messages yet"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {(conv.unread_count ?? 0) > 0 && (
                      <Badge className="h-5 px-1.5 text-[10px] bg-primary">
                        {conv.unread_count} new
                      </Badge>
                    )}
                    {conv.status === "resolved" && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export default ConversationSidebar;
