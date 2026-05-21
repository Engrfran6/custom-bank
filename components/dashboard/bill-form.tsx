"use client";

import {useState} from "react";
import {useAccounts} from "@/lib/hooks/use-accounts";
import {useBillers, usePayBill, useBillHistory} from "@/lib/hooks/use-bills";
import {BillerCard} from "./biller-card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {CheckCircle2, Loader2, AlertCircle, Calendar, RefreshCw, ChevronRight} from "lucide-react";
import {cn} from "@/lib/utils/utils";

type Step = "select" | "details" | "confirm" | "processing" | "done";

export function BillForm() {
  const {accounts} = useAccounts();
  const {billers, loading: billersLoading} = useBillers();
  const {pay, loading, error, success, reset} = usePayBill();
  const {reload} = useBillHistory();

  const [step, setStep] = useState<Step>("select");
  const [selectedBiller, setSelectedBiller] = useState<string>("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [accountRef, setAccountRef] = useState("");
  const [amount, setAmount] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);

  const biller = billers.find((b) => b.id === selectedBiller);
  const fromAccount = accounts.find((a) => a.id === fromAccountId);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

  const handlePay = async () => {
    setStep("processing");
    const ok = await pay({
      from_account_id: fromAccountId,
      biller_id: selectedBiller,
      account_ref: accountRef,
      amount: Number(amount),
      scheduled_at: scheduledAt || undefined,
      is_recurring: isRecurring,
    });
    if (ok) {
      setStep("done");
      reload();
    } else setStep("confirm");
  };

  const handleReset = () => {
    reset();
    setStep("select");
    setSelectedBiller("");
    setFromAccountId("");
    setAccountRef("");
    setAmount("");
    setScheduledAt("");
    setIsRecurring(false);
  };

  // ── Processing ─────────────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="flex flex-col items-center gap-6 py-16">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">Processing Payment</p>
          <p className="mt-1 text-sm text-muted-foreground">Paying {biller?.name} — please wait</p>
        </div>
      </div>
    );
  }

  // ── Done ───────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-5 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">
            {scheduledAt ? "Payment Scheduled" : "Payment Successful"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {fmt(Number(amount))}{" "}
            {scheduledAt
              ? `scheduled for ${new Date(scheduledAt).toLocaleDateString()}`
              : `paid to ${biller?.name}`}
          </p>
        </div>
        <Button variant="outline" onClick={handleReset}>
          Pay Another Bill
        </Button>
      </div>
    );
  }

  // ── Confirm ────────────────────────────────────────────────
  if (step === "confirm") {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-muted/40 p-5">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Confirm Payment
          </p>
          <div className="flex flex-col gap-3 text-sm">
            {[
              ["Biller", `${biller?.logo} ${biller?.name}`],
              ["Reference", accountRef],
              [
                "From Account",
                `${fromAccount?.account_type} ••• ${fromAccount?.account_number.slice(-4)}`,
              ],
              ["Amount", fmt(Number(amount))],
              [
                "Schedule",
                scheduledAt
                  ? new Date(scheduledAt).toLocaleDateString("en-US", {dateStyle: "long"})
                  : "Pay now",
              ],
              ["Recurring", isRecurring ? "Yes (monthly)" : "No"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setStep("details")}>
            Back
          </Button>
          <Button className="flex-1" onClick={handlePay} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {scheduledAt ? "Schedule Payment" : "Pay Now"}
          </Button>
        </div>
      </div>
    );
  }

  // ── Details form ───────────────────────────────────────────
  if (step === "details") {
    return (
      <div className="flex flex-col gap-5">
        {/* Selected biller banner */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <span className="text-2xl">{biller?.logo}</span>
          <div>
            <p className="text-sm font-medium">{biller?.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{biller?.type}</p>
          </div>
          <button
            type="button"
            onClick={() => setStep("select")}
            className="ml-auto text-xs text-primary hover:underline">
            Change
          </button>
        </div>

        {/* Account */}
        <div className="grid gap-1.5">
          <Label>From Account</Label>
          <Select value={fromAccountId} onValueChange={setFromAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center justify-between gap-6">
                    <span className="capitalize">{a.account_type}</span>
                    <span className="text-xs text-muted-foreground">{fmt(Number(a.balance))}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Account reference */}
        <div className="grid gap-1.5">
          <Label>Account / Meter Number</Label>
          <Input
            placeholder="Your account number with the biller"
            value={accountRef}
            onChange={(e) => setAccountRef(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="grid gap-1.5">
          <Label>Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-sm text-muted-foreground">$</span>
            <Input
              className="pl-7"
              placeholder="0.00"
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {fromAccount && amount && (
            <p
              className={cn(
                "text-xs",
                Number(amount) > Number(fromAccount.balance)
                  ? "text-red-500"
                  : "text-muted-foreground",
              )}>
              Available: {fmt(Number(fromAccount.balance))}
            </p>
          )}
        </div>

        {/* Schedule */}
        <div className="grid gap-1.5">
          <Label className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            Schedule Date
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            type="datetime-local"
            min={new Date().toISOString().slice(0, 16)}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>

        {/* Recurring */}
        <button
          type="button"
          onClick={() => setIsRecurring(!isRecurring)}
          className={cn(
            "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
            isRecurring ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
          )}>
          <RefreshCw
            className={cn(
              "h-4 w-4 shrink-0",
              isRecurring ? "text-primary" : "text-muted-foreground",
            )}
          />
          <div>
            <p className="text-sm font-medium">Recurring Monthly</p>
            <p className="text-xs text-muted-foreground">Automatically pay this bill every month</p>
          </div>
          <div
            className={cn(
              "ml-auto h-5 w-9 rounded-full transition-colors",
              isRecurring ? "bg-primary" : "bg-muted",
            )}>
            <div
              className={cn(
                "h-5 w-5 rounded-full border-2 border-white bg-white shadow transition-transform",
                isRecurring ? "translate-x-4" : "translate-x-0",
              )}
            />
          </div>
        </button>

        <Button
          onClick={() => setStep("confirm")}
          disabled={!fromAccountId || !accountRef || !amount || Number(amount) <= 0}>
          Review Payment
          <ChevronRight className="ml-auto h-4 w-4" />
        </Button>
      </div>
    );
  }

  // ── Biller select ──────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">Choose a biller to get started</p>
      {billersLoading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({length: 6}).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {billers.map((b) => (
            <BillerCard
              key={b.id}
              biller={b}
              selected={selectedBiller === b.id}
              onClick={() => setSelectedBiller(b.id)}
            />
          ))}
        </div>
      )}
      <Button onClick={() => setStep("details")} disabled={!selectedBiller}>
        Continue
        <ChevronRight className="ml-auto h-4 w-4" />
      </Button>
    </div>
  );
}
