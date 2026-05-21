// components/dashboard/savings-goal-dialog.tsx
"use client";

import {useState} from "react";
import {useQueryClient} from "@tanstack/react-query";
import {createClient} from "@/lib/supabase/client-with-offline";
import {Button} from "../ui/button";
import {Input} from "../ui/input";
import {Label} from "../ui/label";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "../ui/dialog";
import {Loader2} from "lucide-react";
import {toast} from "sonner";
import {SavingsGoal} from "@/types/database";

interface SavingsGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  existing?: SavingsGoal | null;
}

export function SavingsGoalDialog({open, onOpenChange, userId, existing}: SavingsGoalDialogProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const isEditing = !!existing?.id;

  const [name, setName] = useState(existing?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(existing?.target_amount?.toString() ?? "");
  const [durationMonths, setDurationMonths] = useState(() => {
    if (!existing?.deadline) return "";
    const months = Math.round(
      (new Date(existing.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30),
    );
    return months.toString();
  });
  const [loading, setLoading] = useState(false);

  const deadline = durationMonths
    ? new Date(Date.now() + Number(durationMonths) * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
    : null;

  const monthlyTarget =
    targetAmount && durationMonths
      ? (Number(targetAmount) - (existing?.current_amount ?? 0)) / Number(durationMonths)
      : null;

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error("Please enter a goal name.");
    if (!targetAmount || Number(targetAmount) <= 0)
      return toast.error("Please enter a valid target amount.");

    setLoading(true);
    try {
      if (isEditing) {
        const {error} = await supabase
          .from("savings_goals")
          .update({
            name: name.trim(),
            target_amount: Number(targetAmount),
            deadline,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (error) throw error;
        toast.success("Goal updated.");
      } else {
        const {error} = await supabase.from("savings_goals").insert({
          user_id: userId,
          name: name.trim(),
          target_amount: Number(targetAmount),
          current_amount: 0,
          deadline,
        });
        if (error) throw error;
        toast.success("Goal created.");
      }

      queryClient.invalidateQueries({queryKey: ["savings-goal", userId]});
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Adjust Goal" : "Create Savings Goal"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-1.5">
            <Label htmlFor="goal-name">Goal Name</Label>
            <Input
              id="goal-name"
              placeholder="e.g. Emergency Fund, Vacation"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="target-amount">Target Amount ($)</Label>
            <Input
              id="target-amount"
              type="number"
              min="1"
              placeholder="10000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="duration">Duration (months)</Label>
            <select
              id="duration"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}>
              <option value="">No deadline</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">1 year</option>
              <option value="24">2 years</option>
              <option value="36">3 years</option>
              <option value="60">5 years</option>
            </select>
          </div>

          {/* Live preview */}
          {monthlyTarget && monthlyTarget > 0 && (
            <div className="rounded-lg bg-muted px-4 py-3 space-y-1">
              <p className="text-xs text-muted-foreground">To hit your goal you need to save</p>
              <p className="text-sm font-semibold">
                ${monthlyTarget.toFixed(2)}{" "}
                <span className="font-normal text-muted-foreground">/ month</span>
              </p>
              {deadline && (
                <p className="text-xs text-muted-foreground">
                  Target date:{" "}
                  {new Date(deadline).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
