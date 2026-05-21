// app/auth/account-setup/page.tsx
"use client";

import {useEffect, useState, useRef} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client-with-offline";

const STEPS = [
  "Verifying your identity...",
  "Creating your profile...",
  "Setting up your checking account...",
  "Setting up your savings account...",
  "Almost there...",
];

function generateAccountNumber(): string {
  const prefix = "200";
  const digits = Array.from({length: 8}, () => Math.floor(Math.random() * 10)).join("");
  return `${prefix}${digits}`;
}

export default function AccountSetupPage() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 900);

    setupAccounts().finally(() => clearInterval(interval));
  }, []);

  async function setupAccounts() {
    const supabase = createClient();
    setError(null);

    try {
      // ── 1. Get authenticated user ──────────────────────────────────
      const {
        data: {user},
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Could not retrieve your session.");

      // ── 2. Check if user has completed onboarding ────────────────────
      const {data: profile, error: profileError} = await supabase
        .from("profiles")
        .select("full_name, phone, employment_status")
        .eq("id", user.id)
        .single();

      if (profileError) throw new Error("Profile not found. Please complete onboarding first.");

      // Check if required onboarding fields are present
      if (!profile?.full_name || !profile?.phone || !profile?.employment_status) {
        router.push("/auth/setup");
        throw new Error("Please complete your onboarding first.");
      }

      // ── 3. Check which account types already exist ─────────────────
      const {data: existingAccounts, error: fetchError} = await supabase
        .from("accounts")
        .select("account_type")
        .eq("user_id", user.id);

      if (fetchError) throw new Error(`Could not check existing accounts: ${fetchError.message}`);

      const existing = new Set(existingAccounts?.map((a) => a.account_type) ?? []);

      // ── 4. Build only the missing accounts ────────────────────────
      const accountsToCreate: {
        user_id: string;
        account_number: string;
        account_type: "checking" | "savings" | "investment";
        currency: string;
        balance: number;
        status: "active";
      }[] = [];

      if (!existing.has("checking")) {
        accountsToCreate.push({
          user_id: user.id,
          account_number: generateAccountNumber(),
          account_type: "checking",
          currency: "USD",
          balance: 0,
          status: "active",
        });
      }

      if (!existing.has("savings")) {
        accountsToCreate.push({
          user_id: user.id,
          account_number: generateAccountNumber(),
          account_type: "savings",
          currency: "USD",
          balance: 0,
          status: "active",
        });
      }

      if (!existing.has("investment")) {
        accountsToCreate.push({
          user_id: user.id,
          account_number: generateAccountNumber(),
          account_type: "investment",
          currency: "USD",
          balance: 0,
          status: "active",
        });
      }

      if (accountsToCreate.length > 0) {
        const {error: accountsError} = await supabase.from("accounts").insert(accountsToCreate);

        if (accountsError) throw new Error(`Account creation failed: ${accountsError.message}`);
      }

      setIsComplete(true);

      // ── 6. Brief pause so UI doesn't flash, then redirect
      await new Promise((r) => setTimeout(r, 1000));
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Setup failed. Please try again.");
    }
  }

  if (error) {
    return (
      <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold">Setup failed</p>
          <p className="max-w-xs text-sm text-muted-foreground">{error}</p>
        </div>
        <button
          onClick={() => {
            hasRun.current = false;
            setError(null);
            setupAccounts();
          }}
          className="text-sm underline underline-offset-4 hover:text-primary">
          Try again
        </button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="text-lg font-semibold">All set!</p>
          <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full flex-col items-center justify-center gap-8 p-6">
      {/* Spinner */}
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-muted" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="text-xl font-semibold tracking-tight">Setting up your accounts</p>
        <p className="mt-2 min-h-[1.25rem] text-sm text-muted-foreground transition-all duration-300">
          {STEPS[stepIndex]}
        </p>
      </div>

      {/* Progress bar */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-6 rounded-full transition-all duration-500 ${
              i <= stepIndex ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
