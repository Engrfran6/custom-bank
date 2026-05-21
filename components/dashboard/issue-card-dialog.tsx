"use client";

import {useState} from "react";
import {useAccounts} from "@/lib/hooks/use-accounts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {CreditCard, Loader2} from "lucide-react";
import {cn} from "@/lib/utils/utils";

interface IssueCardDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (account_id: string, card_type: "debit" | "credit") => Promise<unknown>;
}

export function IssueCardDialog({open, onOpenChange, onCreate}: IssueCardDialogProps) {
  const {accounts} = useAccounts();
  const [accountId, setAccountId] = useState("");
  const [cardType, setCardType] = useState<"debit" | "credit">("debit");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      await onCreate(accountId, cardType);
      onOpenChange(false);
      setAccountId("");
      setCardType("debit");
    } catch (err) {
      console.log("checking errros======>", err);
      setError(err instanceof Error ? err.message : "Failed to create card");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue New Virtual Card</DialogTitle>
          <DialogDescription>
            A new virtual card will be linked to the selected account.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          {/* Card type selector */}
          <div className="grid gap-1.5">
            <Label>Card Type</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["debit", "credit"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCardType(type)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border p-4 transition-all",
                    cardType === type
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted",
                  )}>
                  <CreditCard
                    className={cn(
                      "h-6 w-6",
                      cardType === type ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="text-sm font-medium capitalize">{type}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {type === "debit" ? "Linked to balance" : "Credit line"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Account selector */}
          <div className="grid gap-1.5">
            <Label>Link to Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.status === "active")
                  .map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <span className="capitalize">{a.account_type}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ••• {a.account_number.slice(-4)}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={!accountId || loading} onClick={handleCreate}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="mr-2 h-4 w-4" />
              )}
              Issue Card
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
