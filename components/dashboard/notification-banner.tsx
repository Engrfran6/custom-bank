// components/dashboard/notification-banner.tsx
"use client";

import {useEffect, useRef} from "react";
import {toast} from "sonner";
import {CheckCircle2, AlertCircle, Info, AlertTriangle} from "lucide-react";
import {Notification} from "@/types/database";

const iconMap = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  info: <Info className="h-4 w-4 text-blue-500" />,
};

export function NotificationBanner({notifications}: {notifications: Notification[]}) {
  const prevLatestTimestamp = useRef<string | null>(null);
  const isMounted = useRef(false);

  useEffect(() => {
    if (!notifications.length) return;

    const latest = notifications[0];

    if (!isMounted.current) {
      isMounted.current = true;
      prevLatestTimestamp.current = latest.created_at;
      return;
    }

    // Only toast if this notification is genuinely newer
    if (
      !latest.created_at ||
      latest.created_at === prevLatestTimestamp.current ||
      (prevLatestTimestamp.current && latest.created_at <= prevLatestTimestamp.current)
    ) {
      return;
    }

    prevLatestTimestamp.current = latest.created_at;

    toast.custom(
      (t) => (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg w-80">
          {iconMap[latest.type as keyof typeof iconMap] ?? iconMap.info}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{latest.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{latest.body}</p>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            ×
          </button>
        </div>
      ),
      {duration: 500000},
    );
  }, [notifications]);

  return null;
}
