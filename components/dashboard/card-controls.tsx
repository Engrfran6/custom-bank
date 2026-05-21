"use client";

import {useState} from "react";
import type {CardWithAccount} from "@/lib/hooks/use-card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Snowflake,
  Sun,
  Gauge,
  XCircle,
  ShieldCheck,
  Globe,
  ShoppingCart,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {cn} from "@/lib/utils/utils";

interface CardControlsProps {
  card: CardWithAccount;
  onUpdate: (id: string, updates: {status?: string; daily_limit?: number}) => Promise<unknown>;
  onCancel: (id: string) => Promise<void>;
}

export function CardControls({card, onUpdate, onCancel}: CardControlsProps) {
  const [limitInput, setLimitInput] = useState(String(card.daily_limit));
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [limitDialog, setLimitDialog] = useState(false);

  const isFrozen = card.status === "frozen";
  const isCancelled = card.status === "cancelled";

  const handle = async (action: string, fn: () => Promise<unknown>) => {
    setLoadingAction(action);
    try {
      await fn();
    } finally {
      setLoadingAction(null);
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

  const controls = [
    {
      id: "freeze",
      label: isFrozen ? "Unfreeze Card" : "Freeze Card",
      desc: isFrozen ? "Re-enable all transactions" : "Block all transactions instantly",
      icon: isFrozen ? Sun : Snowflake,
      color: isFrozen
        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
        : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      disabled: isCancelled,
      onClick: () =>
        handle("freeze", () => onUpdate(card.id, {status: isFrozen ? "active" : "frozen"})),
    },
    {
      id: "limit",
      label: "Daily Limit",
      desc: `Current: ${fmt(card.daily_limit)}`,
      icon: Gauge,
      color: "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400",
      disabled: isCancelled || isFrozen,
      onClick: () => setLimitDialog(true),
    },
    {
      id: "online",
      label: "Online Payments",
      desc: "Control e-commerce usage",
      icon: Globe,
      color: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      disabled: isCancelled || isFrozen,
      onClick: () => {},
    },
    {
      id: "contactless",
      label: "Contactless",
      desc: "Tap-to-pay transactions",
      icon: ShieldCheck,
      color: "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
      disabled: isCancelled || isFrozen,
      onClick: () => {},
    },
    {
      id: "pos",
      label: "In-Store Payments",
      desc: "Physical POS transactions",
      icon: ShoppingCart,
      color: "bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
      disabled: isCancelled || isFrozen,
      onClick: () => {},
    },
    {
      id: "cancel",
      label: "Cancel Card",
      desc: "Permanently disable this card",
      icon: XCircle,
      color: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      disabled: isCancelled,
      onClick: () => setCancelDialog(true),
    },
  ];

  return (
    <>
      {/* Card info strip */}
      <div className="mb-5 rounded-xl border border-border bg-muted/40 p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Card Number</span>
            <span className="font-mono font-medium">
              •••• •••• •••• {card.card_number.slice(-4)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-xs text-muted-foreground">Status</span>
            <span
              className={cn(
                "text-xs font-semibold capitalize",
                card.status === "active" && "text-emerald-600 dark:text-emerald-400",
                card.status === "frozen" && "text-blue-600 dark:text-blue-400",
                card.status === "cancelled" && "text-red-500",
              )}>
              {card.status}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-xs text-muted-foreground">Daily Limit</span>
            <span className="text-xs font-semibold">{fmt(card.daily_limit)}</span>
          </div>
        </div>
      </div>

      {/* Controls grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {controls.map((ctrl) => {
          const Icon = ctrl.icon;
          const isLoading = loadingAction === ctrl.id;

          return (
            <button
              key={ctrl.id}
              onClick={ctrl.onClick}
              disabled={ctrl.disabled || !!loadingAction}
              className={cn(
                "flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-left transition-all hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40",
                !ctrl.disabled && "hover:border-primary/40",
              )}>
              <div className={cn("rounded-lg p-2", ctrl.color)}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div>
                <p className="text-xs font-semibold">{ctrl.label}</p>
                <p className="text-[10px] text-muted-foreground">{ctrl.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Daily limit dialog */}
      <Dialog open={limitDialog} onOpenChange={setLimitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Daily Limit</DialogTitle>
            <DialogDescription>Set the maximum amount that can be spent per day.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 pt-2">
            <div className="grid gap-1.5">
              <Label>New Daily Limit</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
                <Input
                  className="pl-7"
                  type="number"
                  min="10"
                  max="50000"
                  step="100"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">Min: $10 · Max: $50,000</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLimitDialog(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!!loadingAction}
                onClick={() =>
                  handle("limit", async () => {
                    await onUpdate(card.id, {daily_limit: Number(limitInput)});
                    setLimitDialog(false);
                  })
                }>
                {loadingAction === "limit" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Limit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel dialog */}
      <Dialog open={cancelDialog} onOpenChange={setCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Cancel Card
            </DialogTitle>
            <DialogDescription>
              This action is permanent and cannot be undone. The card ending in{" "}
              <strong>{card.card_number.slice(-4)}</strong> will be permanently disabled.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelDialog(false)}>
              Keep Card
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={!!loadingAction}
              onClick={() =>
                handle("cancel", async () => {
                  await onCancel(card.id);
                  setCancelDialog(false);
                })
              }>
              {loadingAction === "cancel" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Cancel Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
