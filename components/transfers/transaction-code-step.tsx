"use client";

import {useState, useEffect, useRef} from "react";
import {Hash, Loader2, RefreshCw, CheckCircle2, AlertCircle, Mail} from "lucide-react";

import {useTransactionCode} from "@/lib/hooks/use-transaction-code";
import {cn} from "@/lib/utils/utils";

interface Props {
  amount: number;
  onVerified: () => void;
  onCancel: () => void;
  email?: string;
}

type TransactionStep = "send" | "verify";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);

export function TransactionCodeStep({email, amount, onVerified, onCancel}: Props) {
  const {
    generate,
    regenerate,
    verify,
    cancel,
    generating,
    verifying,
    code,
    secondsLeft,
    isExpired,
    isPending,
  } = useTransactionCode(amount);

  const [step, setStep] = useState<TransactionStep>("send");

  const [input, setInput] = useState("");

  const [message, setMessage] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when verify screen opens
  useEffect(() => {
    if (step === "verify" && isPending) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [step, isPending]);

  const handleSendCode = async () => {
    setMessage(null);

    await generate();

    setStep("verify");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handleVerify = async (value?: string) => {
    const otp = (value ?? input).trim();

    if (otp.length !== 6 || verifying) return;

    setMessage(null);

    const result = await verify(otp);

    if (result.ok) {
      setMessage({
        ok: true,
        text: result.message,
      });

      setTimeout(() => {
        onVerified();
      }, 800);
    } else {
      setMessage({
        ok: false,
        text: result.message,
      });

      setInput("");

      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  const handleResend = async () => {
    setInput("");
    setMessage(null);

    await regenerate();

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const mins = Math.floor(secondsLeft / 60);

  const secs = (secondsLeft % 60).toString().padStart(2, "0");

  const isUrgent = secondsLeft > 0 && secondsLeft <= 60;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Hash className="h-7 w-7 text-primary" />
        </div>

        <h2 className="text-xl font-semibold">
          {step === "send" ? "Authorize Transaction" : "Enter Transaction OTP"}
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          {step === "send"
            ? `We'll send a secure OTP for ${fmt(amount)}`
            : "Enter the 6-digit transaction code"}
        </p>
      </div>

      {/* SEND STEP */}
      {step === "send" && (
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 text-center">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>

            <p className="text-sm text-muted-foreground">Transaction amount</p>

            <p className="mt-1 text-xl font-semibold">{fmt(amount)}</p>

            <div className="mt-4 border-t pt-4">
              <p className="text-sm text-muted-foreground">OTP will be sent to</p>

              <p className="mt-1 break-all text-sm font-medium">
                {email || "your registered email"}
              </p>
            </div>
          </div>

          <button
            onClick={handleSendCode}
            disabled={generating}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-lg py-3",
              "bg-primary text-sm font-medium text-primary-foreground",
              "transition hover:bg-primary/90",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                <Hash className="h-4 w-4" />
                Send Transaction OTP
              </>
            )}
          </button>

          <button
            onClick={onCancel}
            className="w-full rounded-lg py-2.5 text-sm text-muted-foreground transition hover:bg-muted/40">
            Cancel
          </button>
        </div>
      )}

      {/* VERIFY STEP */}
      {step === "verify" && (
        <>
          {/* OTP CARD */}
          <div
            className={cn(
              "rounded-2xl border p-5 text-center transition-colors",
              isExpired
                ? "border-destructive/30 bg-destructive/5"
                : isUrgent
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-border bg-card",
            )}>
            {isExpired ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">Transaction OTP expired</p>

                <p className="text-xs text-muted-foreground">Request a new OTP to continue</p>
              </div>
            ) : (
              <>
                <p className="mb-2 text-xs text-muted-foreground">Transaction amount</p>

                <p className="mb-4 text-lg font-semibold">{fmt(amount)}</p>

                {/* OTP SLOTS */}
                <div className="mb-4 flex items-center justify-center gap-2">
                  {Array.from({length: 6}).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex h-12 w-11 items-center justify-center rounded-xl border text-lg font-semibold transition",
                        input[i]
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-muted/30 text-muted-foreground",
                      )}>
                      {input[i] || ""}
                    </div>
                  ))}
                </div>

                {/* TIMER */}
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                    isUrgent ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground",
                  )}>
                  <span className="font-mono">
                    {mins}:{secs}
                  </span>

                  <span>remaining</span>
                </div>
              </>
            )}
          </div>

          {/* OTP INPUT */}
          {!isExpired && (
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={input}
                onChange={async (e) => {
                  const value = e.target.value.replace(/\D/g, "");

                  setInput(value);

                  if (message) {
                    setMessage(null);
                  }

                  if (value.length === 6 && !verifying) {
                    await handleVerify(value);
                  }
                }}
                placeholder="Enter 6-digit code"
                className={cn(
                  "w-full rounded-xl border bg-background px-4 py-3",
                  "text-center text-2xl font-semibold tracking-[0.5em]",
                  "outline-none transition",
                  "border-border focus:border-primary",
                  message?.ok === false && "border-destructive",
                )}
              />

              <p className="text-center text-xs text-muted-foreground">
                Enter the transaction OTP sent to your email
              </p>
            </div>
          )}

          {/* MESSAGE */}
          {message && (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm",
                message.ok
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                  : "border-destructive/20 bg-destructive/10 text-destructive",
              )}>
              {message.ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0" />
              )}

              {message.text}
            </div>
          )}

          {/* ACTIONS */}
          <div className="flex flex-col gap-2">
            {!isExpired ? (
              <button
                onClick={() => handleVerify()}
                disabled={input.length !== 6 || verifying}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg py-3",
                  "bg-primary text-sm font-medium text-primary-foreground",
                  "transition hover:bg-primary/90",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}>
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Hash className="h-4 w-4" />
                    Verify Transaction
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleResend}
                disabled={generating}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-lg py-3",
                  "bg-primary text-sm font-medium text-primary-foreground",
                  "transition hover:bg-primary/90",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Resend OTP
                  </>
                )}
              </button>
            )}

            <button
              onClick={async () => {
                if (code) {
                  await cancel();
                }

                onCancel();
              }}
              className="rounded-lg py-2.5 text-sm text-muted-foreground transition hover:bg-muted/40">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
