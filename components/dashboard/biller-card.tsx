import {cn} from "@/lib/utils/utils";
import type {Biller} from "@/lib/hooks/use-bills";

interface BillerCardProps {
  biller: Biller;
  selected: boolean;
  onClick: () => void;
}

export function BillerCard({biller, selected, onClick}: BillerCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
        selected
          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
          : "border-border bg-card hover:bg-muted",
      )}>
      <span className="text-2xl">{biller.logo}</span>
      <span className="text-xs font-medium leading-tight">{biller.name}</span>
      <span className="text-[10px] capitalize text-muted-foreground">{biller.type}</span>
    </button>
  );
}
