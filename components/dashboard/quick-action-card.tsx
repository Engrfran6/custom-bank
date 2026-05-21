import {cn} from "@/lib/utils/utils";
import {TransferDialog} from "./transfer-dialog";
import {ReceiveDialog} from "./receive-dialog";
import {Account} from "@/types/database";
import {useState} from "react";

interface QuickActionCardProps {
  account: Account;
  icon: React.ComponentType<{className?: string}>;
  label: string;
  color: string;
  onClick: () => void;
  description?: string;
  badge?: string;
}

export function QuickActionCard({
  icon: Icon,
  label,
  color,
  onClick,
  description,
  badge,
  account,
}: QuickActionCardProps) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const colorConfig = {
    blue: {
      gradient: "from-blue-500 to-blue-600",
      light: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
    },
    emerald: {
      gradient: "from-emerald-500 to-emerald-600",
      light: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    violet: {
      gradient: "from-violet-500 to-violet-600",
      light: "bg-violet-500/10",
      text: "text-violet-600 dark:text-violet-400",
    },
    orange: {
      gradient: "from-orange-500 to-orange-600",
      light: "bg-orange-500/10",
      text: "text-orange-600 dark:text-orange-400",
    },
  };

  const config = colorConfig[color as keyof typeof colorConfig];

  return (
    <>
      <button
        onClick={onClick}
        className={cn(
          "group relative flex items-center gap-2 rounded-xl border p-4 text-left transition-all duration-200",
          "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
          "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800",
        )}>
        {badge && (
          <span
            className={cn(
              "absolute -right-1 -top-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              "bg-gradient-to-r shadow-sm",
              config.gradient,
              "text-white",
            )}>
            {badge}
          </span>
        )}

        <div className={cn("rounded-lg p-1", config.light)}>
          <Icon className={cn("h-5 w-5", config.text)} />
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</span>
          {description && (
            <span className="text-xs text-gray-500 dark:text-gray-400">{description}</span>
          )}
        </div>
      </button>
      <TransferDialog
        open={transferOpen}
        onOpenChange={setTransferOpen}
        fromAccountId={account.id}
        onSuccess={() => {
          // Refresh data or show success notification
          console.log("Transfer completed successfully");
        }}
      />
      {/* Receive Dialog */}
      <ReceiveDialog
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        accountId={account.id}
        accountNumber={account.account_number}
        onSuccess={() => {
          console.log("Deposit completed");
        }}
      />
    </>
  );
}
