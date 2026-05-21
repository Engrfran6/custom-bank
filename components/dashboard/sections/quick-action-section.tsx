import {cn} from "@/lib/utils/utils";
import {ArrowUpRight, CreditCard, Plus, Send} from "lucide-react";

const QUICK_ACTIONS = [
  {
    icon: Send,
    label: "Send Money",
    color: "blue",
    actionName: "send money",
    needsBalance: true,
  },
  {
    icon: Plus,
    label: "Add Money",
    color: "emerald",
    actionName: "add money",
    needsBalance: false,
  },
  {
    icon: CreditCard,
    label: "Pay Bills",
    color: "violet",
    actionName: "pay bills",
    needsBalance: true,
  },
  {
    icon: ArrowUpRight,
    label: "Request",
    color: "orange",
    actionName: "request money",
    needsBalance: false,
  },
] as const;

interface QuickActionSectionProps {
  getActionHandler: (actionName: string) => () => void; // Fixed: returns a function
}

const QuickActionSection = ({getActionHandler}: QuickActionSectionProps) => {
  return (
    <div className="grid grid-cols-4 gap-1.5 md:gap-3 py-6">
      {QUICK_ACTIONS.map(({icon: Icon, label, color, actionName}) => (
        <button
          key={label}
          onClick={getActionHandler(actionName)}
          className={cn(
            "flex flex-col items-center md:justify-center gap-1 md:gap-2 rounded-2xl border border-border bg-card p-2 md:p-4 text-sm font-medium transition-all hover:bg-muted/30 active:scale-95",
          )}>
          <div
            className={cn(
              "p-1.5 rounded-full md:rounded-xl md:p-2.5",
              color === "blue" && "bg-blue-500/10 text-blue-500",
              color === "emerald" && "bg-emerald-500/10 text-emerald-500",
              color === "violet" && "bg-violet-500/10 text-violet-500",
              color === "orange" && "bg-orange-500/10 text-orange-500",
            )}>
            <Icon className="h-5 w-5" />
          </div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default QuickActionSection;
