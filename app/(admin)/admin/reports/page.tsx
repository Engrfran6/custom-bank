"use client";

import {useState} from "react";
import {useAdminReports} from "@/lib/hooks/use-admin-reports";
import {Shield, AlertTriangle, CheckCircle2, Clock, Search} from "lucide-react";
import {cn} from "@/lib/utils/utils";
import type {Report} from "@/types/database";

const STATUS_STYLES = {
  investigating: "bg-red-500/10 text-red-600",
  under_review: "bg-yellow-500/10 text-yellow-600",
  resolved: "bg-emerald-500/10 text-emerald-600",
};

export default function AdminReportsPage() {
  const {reports, loading, updateStatus} = useAdminReports();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selected, setSelected] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.reference.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: reports.length,
    investigating: reports.filter((r) => r.status === "investigating").length,
    under_review: reports.filter((r) => r.status === "under_review").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  const handleUpdate = async (status: Report["status"]) => {
    if (!selected) return;
    setUpdating(true);
    await updateStatus(selected.id, status, adminNotes);
    setUpdating(false);
    setSelected(null);
    setAdminNotes("");
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Security Reports</h1>
        <p className="text-sm text-muted-foreground">
          Manage and investigate user-submitted reports
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {label: "Total", value: stats.total, icon: Shield, color: "text-primary"},
          {
            label: "Investigating",
            value: stats.investigating,
            icon: AlertTriangle,
            color: "text-red-500",
          },
          {label: "Under Review", value: stats.under_review, icon: Clock, color: "text-yellow-500"},
          {label: "Resolved", value: stats.resolved, icon: CheckCircle2, color: "text-emerald-500"},
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
            placeholder="Search reports..."
            className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          {["all", "investigating", "under_review", "resolved"].map((s) => (
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
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm text-muted-foreground">No reports found</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((report) => (
              <div key={report.id} className="p-4 hover:bg-muted/10 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-muted-foreground">
                        {report.reference}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                          STATUS_STYLES[report.status],
                        )}>
                        {report.status.replace("_", " ")}
                      </span>
                      {report.urgent_contact && (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600">
                          Urgent Contact
                        </span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] capitalize">
                        {report.category.replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      {report.amount && <span>Amount: ${report.amount}</span>}
                      <span>{new Date(report.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelected(report);
                      setAdminNotes(report.admin_notes ?? "");
                    }}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manage Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative ml-auto w-full max-w-md bg-card border-l border-border h-full overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Manage Report</h2>
              <button
                onClick={() => setSelected(null)}
                className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="rounded-lg bg-muted/30 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono">{selected.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="capitalize">{selected.category.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date Occurred</span>
                <span>{new Date(selected.date_occurred).toLocaleDateString()}</span>
              </div>
              {selected.amount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span>${selected.amount}</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground rounded-lg bg-muted/30 p-3">
                {selected.description}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">Admin Notes</label>
              <textarea
                rows={4}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary/20"
                placeholder="Internal notes about this report..."
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Update Status</p>
              <div className="flex flex-col gap-2">
                {(["investigating", "under_review", "resolved"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleUpdate(s)}
                    disabled={updating || selected.status === s}
                    className={cn(
                      "rounded-lg px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-40",
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
