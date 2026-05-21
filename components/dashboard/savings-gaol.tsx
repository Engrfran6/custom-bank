"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "../ui/button";
import {Progress} from "../ui/progress";
import {useSavingsGoal} from "@/lib/hooks/use-savings-goal";
import {fmt} from "@/lib/helper";
import {Account} from "@/types/database";
import {toast} from "sonner";
import {SavingsGoalDialog} from "./savings-goal-dialog";

interface SavingsGoalProps {
  userId: string | undefined;
  accounts: Account[];
  guardAction: (action: () => void, actionName: string) => void;
}

const SavingGoals = ({userId, accounts, guardAction}: SavingsGoalProps) => {
  const router = useRouter();
  const {data: savingsGoal, isLoading} = useSavingsGoal(userId);
  const [dialogOpen, setDialogOpen] = useState(false);

  const savingsProgress = savingsGoal
    ? (savingsGoal.current_amount / savingsGoal.target_amount) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="h-2 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        <div className="h-8 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <>
      {savingsGoal ? (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="font-medium">{savingsGoal.name}</span>
            <span className="font-mono text-sm">
              {fmt(savingsGoal.current_amount)} / {fmt(savingsGoal.target_amount)}
            </span>
          </div>
          <Progress value={savingsProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {fmt(savingsGoal.target_amount - savingsGoal.current_amount)} more to reach your goal
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                if (accounts.length === 0) {
                  toast.warning("Please create an account first.");
                  return;
                }
                guardAction(
                  () =>
                    router.push(
                      `/dashboard/transfers?to=savings-goal&goal=${savingsGoal.id}&goalName=${encodeURIComponent(savingsGoal.name)}`,
                    ),
                  "deposit to goal",
                );
              }}>
              Deposit to Goal
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
              Adjust
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">No savings goal set yet.</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => setDialogOpen(true)}>
            Create a Goal
          </Button>
        </div>
      )}

      {userId && (
        <SavingsGoalDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          userId={userId}
          existing={savingsGoal}
        />
      )}
    </>
  );
};

export default SavingGoals;
