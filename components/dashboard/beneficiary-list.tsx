// components/dashboard/beneficiary-list.tsx
"use client";

import Link from "next/link";
import {Users, Building2, UserPlus, ArrowRight} from "lucide-react";
import {useBeneficiaries} from "@/lib/hooks/use-beneficiaries";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Avatar} from "@/components/ui/avatar";
import {Skeleton} from "@/components/ui/skeleton";
import {cn} from "@/lib/utils/utils";

const getInitials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getAvatarColor = (name: string) => {
  const colors = [
    "bg-gradient-to-br from-blue-500 to-blue-600",
    "bg-gradient-to-br from-emerald-500 to-emerald-600",
    "bg-gradient-to-br from-violet-500 to-violet-600",
    "bg-gradient-to-br from-amber-500 to-amber-600",
    "bg-gradient-to-br from-rose-500 to-rose-600",
    "bg-gradient-to-br from-cyan-500 to-cyan-600",
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

export function BeneficiaryList() {
  const {beneficiaries, loading} = useBeneficiaries();
  const preview = beneficiaries.slice(0, 2);

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Beneficiaries</h3>
        </div>
        <Link
          href="/dashboard/beneficiaries"
          className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* List */}
      <div className="space-y-1">
        {loading ? (
          Array.from({length: 4}).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-9 w-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))
        ) : preview.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Users className="h-7 w-7 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No beneficiaries yet</p>
            <Button variant="link" size="sm" className="mt-1 gap-1">
              <UserPlus className="h-3 w-3" /> Add one
            </Button>
          </div>
        ) : (
          preview.map((b) => {
            const name = b.nickname || b.full_name || "?";
            return (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-muted/40 transition-colors">
                <Avatar className="h-9 w-9 shrink-0">
                  <div
                    className={cn(
                      "h-full w-full flex items-center justify-center text-white text-xs font-semibold",
                      getAvatarColor(name),
                    )}>
                    {getInitials(name)}
                  </div>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {b.bank_name}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] shrink-0",
                    b.is_internal
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                  )}>
                  {b.is_internal ? "Internal" : "External"}
                </Badge>
              </div>
            );
          })
        )}
      </div>

      {/* Footer CTA */}
      {!loading && beneficiaries.length > 4 && (
        <Link href="/dashboard/beneficiaries">
          <Button variant="ghost" size="sm" className="w-full mt-3 text-xs">
            +{beneficiaries.length - 4} more beneficiaries
          </Button>
        </Link>
      )}
    </div>
  );
}
