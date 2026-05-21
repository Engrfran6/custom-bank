"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {X} from "lucide-react";
import {useAccounts} from "@/lib/hooks/use-accounts";
import {TransferForm} from "@/components/dashboard/transfer-form";
import {useSearchParams} from "next/navigation";

interface TransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromAccountId?: string;
  preselectedAmount?: number;
  onSuccess?: () => void;
}

export function TransferDialog({
  open,
  onOpenChange,
  fromAccountId,
  onSuccess,
}: TransferDialogProps) {
  const {accounts} = useAccounts();
  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const isSavingGoal = useSearchParams().get("to") === "savings-goal";
  const goalName = useSearchParams().get("goalName");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md sm:max-w-lg md:max-w-xl p-0 overflow-hidden"
        showCloseButton={false}>
        {/* Header */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <DialogHeader className="p-0">
              <DialogTitle className="text-lg">
                {isSavingGoal ? "Deposit to Savings Goal" : "Send Money"}
              </DialogTitle>
              <DialogDescription>
                {isSavingGoal
                  ? `Depositing to: ${goalName ? decodeURIComponent(goalName) : "Savings Goal"}`
                  : fromAccount
                    ? `From: ${fromAccount.account_type.charAt(0).toUpperCase() + fromAccount.account_type.slice(1)} •••• ${fromAccount.account_number.slice(-4)}`
                    : "Select account and enter transfer details"}
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1 hover:bg-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Delegate everything to TransferForm */}
        <div className="p-4 md:p-6">
          <TransferForm
            preselectedAccountId={fromAccountId}
            onSuccess={onSuccess}
            onClose={() => onOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
