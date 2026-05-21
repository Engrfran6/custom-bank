"use client";

import {useState} from "react";
import {MessageCircle, Clock, CheckCircle2, AlertCircle, Search} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import type {SupportTicket} from "@/types/database";
import {useAdminTickets} from "@/lib/hooks/use-admin-tickets";

const PRIORITY_STYLES = {
  low: "bg-blue-500/10 text-blue-600",
  medium: "bg-yellow-500/10 text-yellow-600",
  high: "bg-orange-500/10 text-orange-600",
  urgent: "bg-red-500/10 text-red-600",
};

const STATUS_STYLES = {
  open: "bg-blue-500/10 text-blue-600",
  in_progress: "bg-yellow-500/10 text-yellow-600",
  resolved: "bg-emerald-500/10 text-emerald-600",
  closed: "bg-slate-500/10 text-slate-600",
};

export default function AdminSupportPage() {
  const {tickets, loading, updateTicket} = useAdminTickets();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [updating, setUpdating] = useState(false);

  const filtered = tickets.filter((t) => {
    const matchesSearch =
      t.reference.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || t.status === filterStatus;
    const matchesPriority = filterPriority === "all" || t.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    urgent: tickets.filter((t) => t.priority === "urgent").length,
  };

  const handleUpdate = async (status: SupportTicket["status"]) => {
    if (!selected) return;
    setUpdating(true);
    await updateTicket(selected.id, {
      status,
      ...(reply.trim() ? {admin_reply: reply.trim()} : {}),
    });
    setUpdating(false);
    setSelected(null);
    setReply("");
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">Manage and respond to user support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label: "Open", value: stats.open, icon: MessageCircle, color: "text-blue-500"},
          {label: "In Progress", value: stats.in_progress, icon: Clock, color: "text-yellow-500"},
          {label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-500"},
          {label: "Urgent", value: stats.urgent, icon: AlertCircle, color: "text-red-500"},
        ].map(({label, value, icon: Icon, color}) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-2xl font-bold mt-1">{value}</p>
              </div>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "open", "in_progress", "resolved", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-all capitalize",
                filterStatus === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}>
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["all", "urgent", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-all capitalize",
                filterPriority === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <MessageCircle className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No tickets found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((ticket) => (
              <div key={ticket.id} className="p-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">
                        {ticket.reference}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                          STATUS_STYLES[ticket.status],
                        )}>
                        {ticket.status.replace("_", " ")}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                          PRIORITY_STYLES[ticket.priority],
                        )}>
                        {ticket.priority}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize">
                        {ticket.category}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm font-medium">{ticket.subject}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {ticket.message}
                    </p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                      {ticket.admin_reply && (
                        <span className="ml-2 text-emerald-600">• Replied</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelected(ticket);
                      setReply(ticket.admin_reply ?? "");
                    }}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                    Respond
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Response Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative ml-auto w-full max-w-md bg-card border-l border-border h-full overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Respond to Ticket</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="rounded-lg bg-muted/30 p-4 space-y-2 text-sm">
              <p className="font-medium">{selected.subject}</p>
              <div className="flex gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    PRIORITY_STYLES[selected.priority],
                  )}>
                  {selected.priority}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize">
                  {selected.category}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-1">User Message</p>
              <p className="text-sm text-muted-foreground rounded-lg bg-muted/30 p-3">
                {selected.message}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Reply to User</label>
              <textarea
                rows={5}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/20"
                placeholder="Type your response to the user..."
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Update Status</p>
              <div className="flex flex-col gap-2">
                {(["open", "in_progress", "resolved", "closed"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdate(s)}
                    disabled={updating || selected.status === s}
                    className={cn(
                      "rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40 capitalize",
                      selected.status === s
                        ? "bg-primary text-primary-foreground cursor-default"
                        : "border border-border hover:bg-muted",
                    )}>
                    {updating ? "Updating..." : `Mark as ${s.replace("_", " ")}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
