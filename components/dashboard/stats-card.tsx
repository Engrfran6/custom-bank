import {cn} from "@/lib/utils/utils";
import type {LucideIcon} from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: LucideIcon;
  iconClass?: string;
}

export function StatsCard({label, value, change, positive, icon: Icon, iconClass}: StatsCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {change && (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
              )}>
              {positive ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div className={cn("rounded-lg p-2", iconClass ?? "bg-primary/10")}>
          <Icon className={cn("h-5 w-5", iconClass ? "" : "text-primary")} />
        </div>
      </div>
    </div>
  );
}
