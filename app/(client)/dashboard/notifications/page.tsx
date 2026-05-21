"use client";

import {useState} from "react";
import {useNotifications} from "@/lib/hooks/use-notifications";
import {NotificationItem} from "@/components/dashboard/notification-item";
import {Button} from "@/components/ui/button";
import {Skeleton} from "@/components/dashboard/skeleton";
import {Bell, BellOff, CheckCheck, Trash2, ChevronLeft, ChevronRight} from "lucide-react";
import {cn} from "@/lib/utils/utils";

const FILTERS = [
  {value: "all", label: "All"},
  {value: "unread", label: "Unread"},
  {value: "success", label: "Success"},
  {value: "warning", label: "Warnings"},
  {value: "error", label: "Errors"},
  {value: "info", label: "Info"},
];

const filterDotColors: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const {
    notifications,
    unreadCount,
    total,
    loading,
    markRead,
    markAllRead,
    deleteNotification,
    deleteAll,
  } = useNotifications({filter, page, realtime: true});

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>
        <div className="flex flex-col md:flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-muted-foreground"
              onClick={deleteAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {label: "Total", value: total, color: "bg-blue-100   dark:bg-blue-900/20"},
          {label: "Unread", value: unreadCount, color: "bg-yellow-100 dark:bg-yellow-900/20"},
        ].map((s) => (
          <div key={s.label} className={cn("rounded-xl border border-border p-4", s.color)}>
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Filter sidebar */}
        <div className="rounded-xl border border-border bg-card p-4 xl:col-span-1">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Filter
          </p>
          <div className="flex flex-col gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setPage(1);
                }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}>
                {filterDotColors[f.value] && (
                  <div
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      filter === f.value ? "bg-primary-foreground/60" : filterDotColors[f.value],
                    )}
                  />
                )}
                {!filterDotColors[f.value] && <Bell className="h-3.5 w-3.5 shrink-0" />}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification list */}
        <div className="rounded-xl border border-border bg-card xl:col-span-3">
          {/* List header */}
          <div className="border-b border-border px-5 py-3">
            <p className="text-sm font-semibold">
              {FILTERS.find((f) => f.value === filter)?.label} Notifications
            </p>
            <p className="text-xs text-muted-foreground">{total} total</p>
          </div>

          {/* Items */}
          <div className="p-3">
            {loading ? (
              <div className="flex flex-col gap-1">
                {Array.from({length: 6}).map((_, i) => (
                  <div key={i} className="flex gap-3 rounded-xl p-3">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-24 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <BellOff className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {filter !== "all" ? "Try a different filter" : "You're all caught up"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5">
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
