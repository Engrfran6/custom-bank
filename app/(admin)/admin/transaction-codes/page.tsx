"use client";

import {useAdminCodes} from "@/lib/hooks/use-admin-codes";
import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Loader2, RefreshCw, Clock, CheckCircle, XCircle, Hash} from "lucide-react";
import {formatDistanceToNow, format} from "date-fns";
import type {TransactionCode} from "@/types/database";
import {CountdownCell} from "@/components/admin/countdown-cell";

function StatusBadge({status}: {status: TransactionCode["status"]}) {
  switch (status) {
    case "pending":
      return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Pending</Badge>;
    case "used":
      return <Badge className="bg-green-500/10 text-green-600 border-green-200">Used</Badge>;
    case "expired":
      return <Badge className="bg-red-500/10 text-red-600 border-red-200">Expired</Badge>;
    case "cancelled":
      return <Badge className="bg-zinc-500/10 text-zinc-600 border-zinc-200">Cancelled</Badge>;
  }
}

export default function TransactionCodesPage() {
  const {transactionCodes, loading} = useAdminCodes();

  const pending = transactionCodes.filter((c) => c.status === "pending").length;
  const used = transactionCodes.filter((c) => c.status === "used").length;
  const expired = transactionCodes.filter((c) => c.status === "expired").length;
  const cancelled = transactionCodes.filter((c) => c.status === "cancelled").length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Hash className="h-6 w-6 text-primary" />
            Transaction Codes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Live view — updates in realtime</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Realtime connected
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {label: "Pending", value: pending, icon: Clock, color: "text-amber-600"},
          {label: "Used", value: used, icon: CheckCircle, color: "text-green-600"},
          {label: "Expired", value: expired, icon: XCircle, color: "text-red-500"},
          {label: "Cancelled", value: cancelled, icon: RefreshCw, color: "text-zinc-500"},
        ].map(({label, value, icon: Icon, color}) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                </div>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Transaction Codes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transactionCodes.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Hash className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No transaction codes yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time Left</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Used At</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <span className="font-mono font-bold tracking-widest text-primary">
                        {code.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block">
                        {code.profile?.full_name ?? "Unknown"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono font-medium">
                        ${Number(code.amount).toLocaleString("en-US", {minimumFractionDigits: 2})}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={code.status} />
                    </TableCell>
                    <TableCell>
                      <CountdownCell expiresAt={code.expires_at} status={code.status} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(code.expires_at), "HH:mm:ss")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {code.used_at
                        ? formatDistanceToNow(new Date(code.used_at), {addSuffix: true})
                        : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(code.created_at), {addSuffix: true})}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
