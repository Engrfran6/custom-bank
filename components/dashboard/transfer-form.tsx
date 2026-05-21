"use client";

import React, {useState, useEffect, useMemo} from "react";
import {
  Send,
  CheckCircle2,
  UserPlus,
  X,
  Loader2,
  Info,
  AlertCircle,
  Wallet,
  ChevronRight,
  User,
  Building2,
  Globe,
  ArrowLeftRight,
  Target,
} from "lucide-react";
import {createClient} from "@/lib/supabase/client-with-offline";
import {cn} from "@/lib/utils/utils";
import {useAccounts} from "@/lib/hooks/use-accounts";
import {useBeneficiaries} from "@/lib/hooks/use-beneficiaries";
import {useTransfer} from "@/lib/hooks/use-transfer";
import {useSearchParams} from "next/navigation";
import {useSavingsGoal} from "@/lib/hooks/use-savings-goal";
import {useProfile} from "@/lib/hooks/use-profile";
import {QueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {TransactionCodeStep} from "../transfers/transaction-code-step";

// Types
type TransferType = "domestic" | "wire" | "international";
type Step = "form" | "confirm" | "code" | "processing" | "done";

interface FormState {
  from_account_id: string;
  account_number: string;
  routing_number: string;
  swift: string;
  bank_name: string;
  bank_address: string;
  country: string;
  amount: string;
  description: string;
}

const EMPTY_FORM: FormState = {
  from_account_id: "",
  account_number: "",
  routing_number: "",
  swift: "",
  bank_name: "",
  bank_address: "",
  country: "",
  amount: "",
  description: "",
};

const TRANSFER_TYPES: {
  value: TransferType;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  {
    value: "domestic",
    label: "Domestic",
    icon: Building2,
    desc: "US accounts",
  },
  {
    value: "wire",
    label: "Wire",
    icon: Send,
    desc: "Large transfers",
  },
  {
    value: "international",
    label: "International",
    icon: Globe,
    desc: "Global transfers",
  },
];

// Helper functions
const fmt = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const calcFee = (type: TransferType, amount: number, isInternal: boolean) => {
  if (isInternal) return 0;
  if (type === "domestic") return amount > 1000 ? 2.5 : 0;
  if (type === "wire") return 25;
  if (type === "international") return amount * 0.01 + 15;
  return 0;
};

const initials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

const avatarColor = (name: string) => {
  const colors = [
    "bg-primary/20 text-primary",
    "bg-secondary/20 text-secondary",
    "bg-accent/20 text-accent",
    "bg-amber-500/20 text-amber-400",
    "bg-rose-500/20 text-rose-400",
    "bg-cyan-500/20 text-cyan-400",
  ];
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Styled Input Component - Updated to use theme variables
const StyledInput = ({
  prefix,
  suffix,
  className,
  ...props
}: {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "prefix" | "suffix">) => {
  return (
    <div className="relative">
      {prefix && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {prefix}
        </div>
      )}
      <input
        className={cn(
          "w-full rounded-lg border border-border bg-background py-2.5 text-[13px] text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
          prefix ? "pl-9" : "pl-3",
          suffix && "pr-9",
          className,
        )}
        {...props}
      />
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {suffix}
        </div>
      )}
    </div>
  );
};

// Field Component - Updated to use theme variables
const Field = ({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center gap-1.5">
      <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
      {required && <span className="text-[10px] text-destructive">*</span>}
      {optional && <span className="text-[10px] text-muted-foreground/70">(optional)</span>}
      {hint && <span className="text-[10px] text-muted-foreground/70">— {hint}</span>}
    </div>
    {children}
  </div>
);

interface TransferFormProps {
  preselectedAccountId?: string;
  onSuccess?: () => void; // replaces onComplete
  onClose?: () => void;
  compact?: boolean;
}

// ─── main component ───────────────────────────────────────────────────────────
export function TransferForm({
  preselectedAccountId,
  onSuccess,
  onClose,
  compact = false,
}: TransferFormProps) {
  const {accounts} = useAccounts();

  const {beneficiaries, addBeneficiary} = useBeneficiaries();
  const {transfer, loading, error, txId, reset} = useTransfer();
  const {user} = useProfile();
  const queryClient = new QueryClient();
  const searchParams = useSearchParams();
  const goalId = searchParams.get("goal");
  const goalName = searchParams.get("goalName");
  const isSavingsGoal = !!goalId;

  const {data: savingsGoal} = useSavingsGoal(isSavingsGoal ? user?.id : undefined);

  const [transferType, setTransferType] = useState<TransferType>("domestic");
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>({
    ...EMPTY_FORM,
    from_account_id: preselectedAccountId || "",
  });
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [savingBene, setSavingBene] = useState(false);

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({...p, [key]: e.target.value}));

  const fromAccount = accounts.find((a) => a.id === form.from_account_id);

  const amount = Number(form.amount) || 0;
  const fee = calcFee(transferType, amount, isInternal);
  const total = amount + fee;

  const insufficientFunds = fromAccount && amount > 0 && total > Number(fromAccount.balance);

  // ── recipient lookup (domestic) ──────────────────────────────────────────
  useEffect(() => {
    if (transferType !== "domestic") return;

    const number = form.account_number.trim();

    if (number.length < 10) return;

    let cancelled = false;

    const runLookup = async () => {
      setLookingUp(true);

      const supabase = createClient();

      const {data} = await supabase.rpc("lookup_account_by_number", {
        p_account_number: number,
      });

      if (cancelled) return;

      if (data && data.length > 0) {
        const row = data[0];

        const {
          data: {user},
        } = await supabase.auth.getUser();

        if (cancelled) return;

        setRecipientName(row.full_name ?? row.email ?? "Unknown");
        setIsInternal(row.user_id === user?.id);
      } else {
        setRecipientName(null);
        setIsInternal(false);
      }

      setLookingUp(false);
    };

    const t = setTimeout(runLookup, 600);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [form.account_number, transferType]);

  // ── validation ───────────────────────────────────────────────────────────
  const isValid = useMemo(() => {
    if (!form.from_account_id || !amount || insufficientFunds) return false;
    if (transferType === "domestic") {
      return (
        recipientName !== null &&
        /^\d{10,11}$/.test(form.account_number) &&
        /^\d{9}$/.test(form.routing_number)
      );
    }
    if (transferType === "wire") {
      return (
        !!form.account_number &&
        /^\d{9}$/.test(form.routing_number) &&
        !!form.bank_name &&
        !!form.bank_address
      );
    }
    if (transferType === "international") {
      return (
        !!form.account_number &&
        /^[A-Z0-9]{8,11}$/.test(form.swift) &&
        !!form.bank_name &&
        !!form.country
      );
    }
    return false;
  }, [form, amount, transferType, recipientName, insufficientFunds]);

  // ── handlers ─────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setStep("confirm");
  };

  const handleConfirm = () => {
    setStep("code");
  };

  const handleCodeVerified = async () => {
    setStep("processing");
    const ok = await transfer({
      from_account_id: form.from_account_id,
      to_account_number: form.account_number.trim(),
      amount,
      description: form.description || undefined,
    });

    if (ok) {
      toast.success(`${fmt(amount)} sent successfully!`, {
        description: `New balance: ${fmt((Number(fromAccount?.balance) || 0) - amount)}`,
      });
      setStep("done");
      onSuccess?.();
    } else {
      setStep("form");
    }
  };

  if (step === "code") {
    return (
      <TransactionCodeStep
        amount={amount}
        onVerified={handleCodeVerified}
        onCancel={() => setStep("confirm")} // go back to confirm, not form
      />
    );
  }

  const handleSaveBeneficiary = async () => {
    if (!nickname.trim()) return;
    setSavingBene(true);
    await addBeneficiary({
      nickname: nickname.trim(),
      account_number: form.account_number,
      full_name: recipientName ?? "",
      bank_name: isInternal
        ? (process.env.NEXT_PUBLIC_APP_NAME ?? "NeoBank")
        : form.bank_name || "External",
      bank_code: "",
      is_internal: isInternal,
      account_name: recipientName ?? "",
    });

    toast.success("Beneficiary saved.");

    setSavingBene(false);
    setSaveOpen(false);
    setNickname("");
  };

  const beneficiaryAlreadySaved = beneficiaries.some(
    (b) => b.account_number === form.account_number,
  );

  const handleReset = () => {
    reset();
    setStep("form");
    setForm(EMPTY_FORM);
    setRecipientName(null);
    setIsInternal(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PROCESSING
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="flex flex-col items-center gap-5 py-16">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-border" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-primary/10">
            <Send className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-foreground">Processing Transfer</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Sending {fmt(amount)} — please don&apos;t close this window
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // DONE
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-5 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-foreground">Transfer Successful</p>
          <p className="mt-1 text-[13px] text-muted-foreground">{fmt(amount)} sent successfully</p>
          {txId && (
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              Ref: {txId.slice(0, 16).toUpperCase()}
            </p>
          )}
        </div>

        {/* Save beneficiary prompt — only if external and not already saved */}
        {recipientName && !beneficiaryAlreadySaved && (
          <div className="w-full rounded-xl border border-dashed border-border bg-muted/30 p-4">
            {saveOpen ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[13px] font-medium">Save Recipient</p>
                  <button
                    onClick={() => setSaveOpen(false)}
                    className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Field label="Nickname" required>
                  <StyledInput
                    placeholder="e.g. John's Savings"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
                </Field>
                <button
                  onClick={handleSaveBeneficiary}
                  disabled={!nickname.trim() || savingBene}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-[13px] font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50">
                  {savingBene && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Beneficiary
                </button>
              </>
            ) : savingBene === false && nickname === "" && saveOpen === false ? (
              // Prompt state
              <>
                <p className="text-sm font-medium">Save this recipient?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add them to your beneficiaries for faster transfers next time
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setSaveOpen(true)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-[13px] font-medium transition hover:bg-accent/10">
                    <UserPlus className="h-3.5 w-3.5" />
                    Save Recipient
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 rounded-lg px-4 py-2 text-[13px] text-muted-foreground transition hover:bg-muted/40">
                    Not now
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* Confirmed save state */}
        {beneficiaryAlreadySaved && recipientName && (
          <div className="flex items-center gap-2 text-[13px] text-emerald-500">
            <CheckCircle2 className="h-4 w-4" />
            Recipient is saved to your beneficiaries
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="rounded-lg border border-border bg-card px-4 py-2 text-[13px] text-foreground transition hover:bg-accent/10">
            New Transfer
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg bg-primary/10 px-4 py-2 text-[13px] font-medium text-primary transition hover:bg-primary/20">
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CONFIRM
  // ─────────────────────────────────────────────────────────────────────────
  if (step === "confirm") {
    const rows: [string, string][] = [
      [
        "From",
        `${fromAccount?.account_type ?? ""} ••••${fromAccount?.account_number.slice(-4) ?? ""}`,
      ],
      [
        "To",
        transferType === "international"
          ? `${form.account_number} · ${form.bank_name}`
          : transferType === "wire"
            ? `${form.account_number} · ${form.bank_name}`
            : `${form.account_number}${recipientName ? ` · ${recipientName}` : ""}`,
      ],
      ["Type", TRANSFER_TYPES.find((t) => t.value === transferType)?.label ?? ""],
      ["Amount", fmt(amount)],
      ["Fee", fee > 0 ? fmt(fee) : "Free"],
      ["Total Debit", fmt(total)],
      ...(form.description ? [["Note", form.description] as [string, string]] : []),
    ];

    return (
      <div className="flex flex-col gap-4">
        {/* Recipient highlight */}
        {(recipientName || form.bank_name) && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div
              className={cn(
                "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[12px] font-semibold",
                avatarColor(recipientName ?? form.bank_name),
              )}>
              {initials(recipientName ?? form.bank_name)}
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">
                {recipientName ?? form.bank_name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isInternal
                  ? "Internal · Free"
                  : TRANSFER_TYPES.find((t) => t.value === transferType)?.label}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-mono text-[18px] font-semibold text-foreground">{fmt(amount)}</p>
              {fee > 0 && (
                <p className="font-mono text-[11px] text-muted-foreground">+{fmt(fee)} fee</p>
              )}
            </div>
          </div>
        )}

        {/* Details table */}
        <div className="rounded-xl border border-border bg-card">
          {rows.map(([label, value], i) => (
            <div
              key={label}
              className={cn(
                "flex items-center justify-between px-4 py-3 text-[13px]",
                i < rows.length - 1 && "border-b border-border",
                label === "Total Debit" && "font-semibold",
              )}>
              <span className="text-muted-foreground">{label}</span>
              <span
                className={cn(
                  "font-mono text-foreground",
                  label === "Total Debit" && "text-[15px]",
                )}>
                {value}
              </span>
            </div>
          ))}
        </div>

        {/* Notice */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/15 bg-amber-500/8 px-3 py-2.5">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
          <p className="text-[11px] text-amber-400/80">
            Please verify the recipient details. Transfers cannot be reversed once confirmed.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-destructive" />
            <p className="text-[12px] text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => setStep("form")}
            className="flex-1 rounded-lg border border-border bg-card py-2.5 text-[13px] text-muted-foreground transition hover:bg-accent/10">
            Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-[13px] font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60">
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Confirm & Send
          </button>
        </div>
      </div>
    );
  }

  const handleSavingsDeposit = async () => {
    if (!goalId || !form.from_account_id || !user?.id) return;
    setStep("processing");

    try {
      const res = await fetch("/api/savings-deposit", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
          from_account_id: form.from_account_id,
          goal_id: goalId,
          goal_name: savingsGoal?.name ?? goalName,
          current_goal_amount: savingsGoal?.current_amount ?? 0,
          amount,
          description: form.description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Deposit failed.");
        setStep("form");
        return;
      }

      toast.success(`$${amount.toFixed(2)} deposited to savings goal!`, {
        description: `New balance: ${fmt((Number(fromAccount?.balance) || 0) - amount)}`,
      });

      queryClient.invalidateQueries({queryKey: ["savings-goal", user.id]});
      queryClient.invalidateQueries({queryKey: ["accounts"]});

      setStep("done");
      onSuccess?.();
    } catch {
      toast.error("Network error. Please try again.");
      setStep("form");
    }
  };
  // ─────────────────────────────────────────────────────────────────────────
  // SAVINGS GOAL FLOW
  // ─────────────────────────────────────────────────────────────────────────
  if (isSavingsGoal) {
    if (step === "form") {
      return (
        <form onSubmit={handleSavingsDeposit} className="flex flex-col gap-5">
          {/* Goal info banner */}
          {savingsGoal && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{savingsGoal.name}</p>
                    <p className="text-xs text-muted-foreground">Savings Goal</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="text-sm font-mono font-semibold">
                    {fmt(savingsGoal.target_amount - savingsGoal.current_amount)}
                  </p>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min((savingsGoal.current_amount / savingsGoal.target_amount) * 100, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {fmt(savingsGoal.current_amount)} of {fmt(savingsGoal.target_amount)}
              </p>
            </div>
          )}

          {/* From account */}
          <Field label="From Account" required>
            <div className="relative">
              <Wallet className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <select
                value={form.from_account_id}
                onChange={(e) => setForm((p) => ({...p, from_account_id: e.target.value}))}
                className="w-full appearance-none rounded-lg border border-border bg-background py-2.5 pl-9 pr-8 text-[13px] text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20">
                <option value="" disabled>
                  Select account
                </option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} ••••
                    {a.account_number.slice(-4)} — {fmt(Number(a.balance))}
                  </option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-muted-foreground" />
            </div>
            {fromAccount && (
              <p className="text-[11px] text-muted-foreground">
                Available:{" "}
                <span className="font-mono text-foreground">
                  {fmt(Number(fromAccount.balance))}
                </span>
              </p>
            )}
          </Field>

          {/* Amount */}
          <Field label="Amount" required>
            <StyledInput
              prefix={<span className="text-[13px] font-medium text-muted-foreground">$</span>}
              type="number"
              placeholder="0.00"
              min="0.01"
              step="0.01"
              value={form.amount}
              onChange={set("amount")}
              className={insufficientFunds ? "border-destructive/40" : ""}
            />
            {amount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-emerald-400">No fee — internal transfer</span>
                {insufficientFunds && (
                  <span className="text-[11px] font-medium text-destructive">
                    Insufficient funds
                  </span>
                )}
              </div>
            )}
            {/* Quick amount buttons */}
            {savingsGoal && (
              <div className="flex gap-1.5 flex-wrap">
                {[25, 50, 100, savingsGoal.target_amount - savingsGoal.current_amount]
                  .filter((v) => v > 0)
                  .map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm((p) => ({...p, amount: v.toFixed(2)}))}
                      className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary transition-colors">
                      {v === savingsGoal.target_amount - savingsGoal.current_amount
                        ? "Full amount"
                        : `$${v}`}
                    </button>
                  ))}
              </div>
            )}
          </Field>

          {/* Note */}
          <Field label="Note" optional>
            <StyledInput
              placeholder={`e.g. Monthly contribution to ${goalName ?? "savings goal"}`}
              value={form.description}
              onChange={set("description")}
            />
          </Field>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-destructive" />
              <p className="text-[12px] text-destructive">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!form.from_account_id || !amount || !!insufficientFunds}
            className={cn(
              "group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg py-3 text-[13px] font-semibold tracking-wide transition-all",
              "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20",
              "hover:shadow-xl hover:shadow-primary/30",
              "disabled:cursor-not-allowed disabled:opacity-40",
            )}>
            <Target className="h-3.5 w-3.5" />
            Review Deposit
            <ChevronRight className="ml-auto h-3.5 w-3.5" />
          </button>
        </form>
      );
    }

    // Reuse confirm/processing/done steps but with savings-goal-aware confirm handler
    if (step === "confirm") {
      // same confirm UI but "To" row shows the goal name instead of account number
      // override the rows:
      const rows: [string, string][] = [
        [
          "From",
          `${fromAccount?.account_type ?? ""} ••••${fromAccount?.account_number.slice(-4) ?? ""}`,
        ],
        ["To", `${savingsGoal?.name ?? goalName ?? "Savings Goal"}`],
        ["Amount", fmt(amount)],
        ["Fee", "Free"],
        ...(form.description ? [["Note", form.description] as [string, string]] : []),
      ];

      return (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-medium">{savingsGoal?.name ?? goalName}</p>
              <p className="text-[11px] text-muted-foreground">Savings Goal · Free</p>
            </div>
            <div className="ml-auto">
              <p className="font-mono text-[18px] font-semibold">{fmt(amount)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            {rows.map(([label, value], i) => (
              <div
                key={label}
                className={cn(
                  "flex items-center justify-between px-4 py-3 text-[13px]",
                  i < rows.length - 1 && "border-b border-border",
                )}>
                <span className="text-muted-foreground">{label}</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep("form")}
              className="flex-1 rounded-lg border border-border bg-card py-2.5 text-[13px] text-muted-foreground hover:bg-accent/10 transition">
              Back
            </button>
            <button
              onClick={handleSavingsDeposit}
              disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition">
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Target className="h-3.5 w-3.5" />
              )}
              Confirm Deposit
            </button>
          </div>
        </div>
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN FORM
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* ── Transfer type tabs ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-border bg-card p-1">
        {TRANSFER_TYPES.map(({value, label, icon: Icon, desc}) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setTransferType(value);
              setRecipientName(null);
              setIsInternal(false);
            }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center transition",
              transferType === value
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
            )}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-[12px] font-medium">{label}</span>
            <span className="hidden text-[10px] opacity-60 sm:block">{desc}</span>
          </button>
        ))}
      </div>

      {/* ── From account ────────────────────────────────────────────────── */}
      <Field label="From Account" required>
        <div className="relative">
          <Wallet className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <select
            value={form.from_account_id}
            onChange={(e) => setForm((p) => ({...p, from_account_id: e.target.value}))}
            className="w-full appearance-none rounded-lg border border-border bg-background py-2.5 pl-9 pr-8 text-[13px] text-foreground outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/20">
            <option value="" disabled className="bg-background">
              Select account
            </option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id} className="bg-background">
                {a.account_type.charAt(0).toUpperCase() + a.account_type.slice(1)} ••••
                {a.account_number.slice(-4)} — {fmt(Number(a.balance))}
              </option>
            ))}
          </select>
          <ChevronRight className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-90 text-muted-foreground" />
        </div>
        {fromAccount && (
          <p className="text-[11px] text-muted-foreground">
            Available balance:{" "}
            <span className="font-mono text-foreground">{fmt(Number(fromAccount.balance))}</span>
          </p>
        )}
      </Field>

      {/* ── Beneficiary quick-select ─────────────────────────────────────── */}
      {beneficiaries.length > 0 && (
        <Field label="Saved Recipients">
          <div className="flex flex-wrap gap-1.5">
            {beneficiaries.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setForm((p) => ({...p, account_number: b.account_number}))}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-medium transition",
                  form.account_number === b.account_number
                    ? "border-primary/30 bg-primary/15 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground",
                )}>
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                    avatarColor(b.account_name ?? b.nickname ?? "?"),
                  )}>
                  {initials(b.nickname ?? b.account_name ?? "?")}
                </span>
                {b.nickname ?? b.account_name}
              </button>
            ))}
          </div>
        </Field>
      )}

      {/* ── Account / IBAN number ────────────────────────────────────────── */}
      <Field
        label={transferType === "international" ? "IBAN / Account Number" : "Account Number"}
        required>
        <StyledInput
          prefix={<User className="h-3.5 w-3.5" />}
          placeholder={
            transferType === "international"
              ? "Enter IBAN or account number"
              : "Enter 10-digit account number"
          }
          value={form.account_number}
          onChange={set("account_number")}
          maxLength={transferType === "domestic" ? 11 : 34}
          inputMode={transferType !== "international" ? "numeric" : "text"}
          suffix={lookingUp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : undefined}
        />
        {/* Recipient name feedback */}
        {transferType === "domestic" && (
          <>
            {recipientName && (
              <div className="flex items-center gap-1.5 text-[12px] text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                {recipientName}
                {isInternal && (
                  <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px]">
                    Internal · Free
                  </span>
                )}
              </div>
            )}
            {form.account_number.length >= 10 && !recipientName && !lookingUp && (
              <div className="flex items-center gap-1.5 text-[12px] text-destructive">
                <AlertCircle className="h-3 w-3" />
                Account not found
              </div>
            )}
          </>
        )}
      </Field>

      {/* ── Routing number (domestic + wire) ────────────────────────────── */}
      {(transferType === "domestic" || transferType === "wire") && (
        <Field label="Routing Number" required hint="9-digit ABA routing number">
          <StyledInput
            placeholder="e.g. 021000021"
            value={form.routing_number}
            onChange={set("routing_number")}
            maxLength={9}
            inputMode="numeric"
          />
        </Field>
      )}

      {/* ── Wire-specific fields ─────────────────────────────────────────── */}
      {transferType === "wire" && (
        <>
          <Field label="Bank Name" required>
            <StyledInput
              prefix={<Building2 className="h-3.5 w-3.5" />}
              placeholder="e.g. JPMorgan Chase"
              value={form.bank_name}
              onChange={set("bank_name")}
            />
          </Field>
          <Field label="Bank Address" required>
            <StyledInput
              placeholder="270 Park Ave, New York, NY 10017"
              value={form.bank_address}
              onChange={set("bank_address")}
            />
          </Field>
        </>
      )}

      {/* ── International-specific fields ───────────────────────────────── */}
      {transferType === "international" && (
        <>
          <Field label="SWIFT / BIC Code" required hint="8–11 alphanumeric characters">
            <StyledInput
              placeholder="e.g. AAAABBCC123"
              value={form.swift}
              onChange={(e) => setForm((p) => ({...p, swift: e.target.value.toUpperCase()}))}
              maxLength={11}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Country" required>
              <StyledInput
                prefix={<Globe className="h-3.5 w-3.5" />}
                placeholder="e.g. United Kingdom"
                value={form.country}
                onChange={set("country")}
              />
            </Field>
            <Field label="Bank Name" required>
              <StyledInput
                placeholder="e.g. Barclays"
                value={form.bank_name}
                onChange={set("bank_name")}
              />
            </Field>
          </div>
        </>
      )}

      {/* ── Amount ──────────────────────────────────────────────────────── */}
      <Field label="Amount" required>
        <StyledInput
          prefix={<span className="text-[13px] font-medium text-muted-foreground">$</span>}
          type="number"
          placeholder="0.00"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={set("amount")}
          className={
            insufficientFunds
              ? "border-destructive/40 focus:border-destructive/60 focus:ring-destructive/20"
              : ""
          }
        />
        {/* Fee / balance row */}
        {amount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {fee > 0 ? (
                <>
                  <span>Fee:</span>
                  <span className="font-mono text-foreground">{fmt(fee)}</span>
                  <span>·</span>
                  <span>Total:</span>
                  <span className="font-mono text-foreground">{fmt(total)}</span>
                </>
              ) : (
                <span className="text-emerald-400">No fee — free transfer</span>
              )}
            </div>
            {insufficientFunds && (
              <span className="text-[11px] font-medium text-destructive">Insufficient funds</span>
            )}
          </div>
        )}
      </Field>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <Field label="Description" optional>
        <StyledInput
          placeholder="e.g. Rent payment, Invoice #1032"
          value={form.description}
          onChange={set("description")}
        />
      </Field>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-destructive" />
          <p className="text-[12px] text-destructive">{error}</p>
        </div>
      )}

      {/* ── Submit ──────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={!isValid || loading}
        className={cn(
          "group px-5 relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg py-3 text-[13px] font-semibold tracking-wide transition-all duration-200",
          "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20",
          "hover:shadow-xl hover:shadow-primary/30 hover:from-primary/90 hover:to-primary",
          "active:scale-[0.98]",
          "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 disabled:hover:shadow-lg disabled:hover:shadow-primary/20",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background",
        )}>
        {/* Shimmer effect */}
        <span className="absolute inset-0 -translate-x-full rounded-lg bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing Transfer...</span>
          </>
        ) : (
          <>
            <ArrowLeftRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-12" />
            <span>Review Transfer</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
