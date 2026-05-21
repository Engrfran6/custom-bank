import {cn} from "@/lib/utils/utils";

export function Skeleton({className}: {className?: string}) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function AccountCardSkeleton() {
  return <Skeleton className="h-44 w-full rounded-2xl" />;
}

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-3">
      <Skeleton className="h-9 w-9 rounded-full shrink-0" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  );
}
