"use client";

import {cn} from "@/lib/utils/utils";
import type {Notification} from "@/types/database";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  ArrowLeftRight,
  CreditCard,
  Receipt,
  Trash2,
  Check,
} from "lucide-react";

const typeConfig = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-600 dark:text-emerald-400",
    bgClass: "bg-emerald-100 dark:bg-emerald-900/30",
    dotClass: "bg-emerald-500",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-yellow-600 dark:text-yellow-400",
    bgClass: "bg-yellow-100 dark:bg-yellow-900/30",
    dotClass: "bg-yellow-500",
  },
  error: {
    icon: XCircle,
    iconClass: "text-red-500",
    bgClass: "bg-red-100 dark:bg-red-900/20",
    dotClass: "bg-red-500",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-600 dark:text-blue-400",
    bgClass: "bg-blue-100 dark:bg-blue-900/30",
    dotClass: "bg-blue-500",
  },
};

// Map notification title keywords to contextual icons
function getContextIconType(title: string) {
  const t = title.toLowerCase();
  if (t.includes("transfer") || t.includes("sent") || t.includes("received")) {
    return "transfer";
  }
  if (t.includes("card")) return "card";
  if (t.includes("bill") || t.includes("payment")) return "payment";
  return null;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

export function NotificationItem({
  notification: n,
  onMarkRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const config = typeConfig[n.type as keyof typeof typeConfig] ?? typeConfig.info;
  const TypeIcon = config.icon;
  const contextIconType = getContextIconType(n.title);

  let DisplayIcon = TypeIcon;
  if (contextIconType === "transfer") DisplayIcon = ArrowLeftRight;
  else if (contextIconType === "card") DisplayIcon = CreditCard;
  else if (contextIconType === "payment") DisplayIcon = Receipt;

  const timeAgo = formatTimeAgo(new Date(n.created_at));

  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-xl p-3 transition-colors",
        !n.is_read && "bg-muted/50",
        "hover:bg-muted/70",
      )}>
      {/* Unread dot */}
      {!n.is_read && (
        <div className={cn("absolute right-3 top-3 h-2 w-2 rounded-full", config.dotClass)} />
      )}

      {/* Icon */}
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          config.bgClass,
        )}>
        <DisplayIcon className={cn("h-4 w-4", config.iconClass)} />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-0.5 min-w-0 pr-6">
        <p
          className={cn(
            "text-sm leading-snug",
            !n.is_read ? "font-semibold" : "font-medium text-muted-foreground",
          )}>
          {n.title}
        </p>
        <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{n.body}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground/70">{timeAgo}</p>
      </div>

      {/* Actions — shown on hover */}
      {!compact && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-1 group-hover:flex">
          {!n.is_read && onMarkRead && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(n.id);
              }}
              className="rounded p-1 hover:bg-background transition-colors"
              title="Mark as read">
              <Check className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(n.id);
              }}
              className="rounded p-1 hover:bg-background transition-colors"
              title="Delete">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    return `${m}m ago`;
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600);
    return `${h}h ago`;
  }
  if (seconds < 604800) {
    const d = Math.floor(seconds / 86400);
    return `${d}d ago`;
  }
  return date.toLocaleDateString("en-US", {month: "short", day: "numeric"});
}
