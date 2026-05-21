"use client";

import {useEffect, useState} from "react";
import {useNotifications} from "@/lib/hooks/use-notifications";
import {NotificationItem} from "@/components/dashboard/notification-item";
import {Button} from "@/components/ui/button";
import {Sheet, SheetContent, SheetHeader, SheetTitle} from "@/components/ui/sheet";
import {Badge} from "@/components/ui/badge";
import {Bell, BellOff, CheckCheck, Trash2, SlidersHorizontal} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import Link from "next/link";
import {NotificationBanner} from "../dashboard/notification-banner";

const FILTERS = [
  {value: "all", label: "All"},
  {value: "unread", label: "Unread"},
  {value: "success", label: "Success"},
  {value: "warning", label: "Warning"},
  {value: "error", label: "Error"},
  {value: "info", label: "Info"},
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");

  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    deleteNotification,
    deleteAll,
  } = useNotifications({filter, realtime: true});

  return (
    <>
      <NotificationBanner notifications={notifications} />
      {/* Bell trigger */}
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(true)}>
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Slide-over panel */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md pt-6">
          {/* Header */}
          <SheetHeader className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount} unread
                  </Badge>
                )}
              </SheetTitle>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => markAllRead}>
                    <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 sm:w-auto p-0 sm:px-3 text-xs text-muted-foreground"
                    onClick={() => deleteAll}>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline ml-1.5">Clear all</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Filter tabs */}
            <div className="mt-3 flex gap-1 overflow-x-auto pb-0.5">
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                    filter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}>
                  {f.label}
                </button>
              ))}
            </div>
          </SheetHeader>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex flex-col gap-1 p-3">
                {Array.from({length: 5}).map((_, i) => (
                  <div key={i} className="flex gap-3 rounded-xl p-3">
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                      <div className="h-3 w-full animate-pulse rounded bg-muted" />
                      <div className="h-2 w-16 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <BellOff className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {filter !== "all" ? "Try a different filter" : "You're all caught up"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 p-3">
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkRead={(id) => markRead([id])}
                    onDelete={(id) => deleteNotification([id])}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/notifications" onClick={() => setOpen(false)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Notification Settings
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
