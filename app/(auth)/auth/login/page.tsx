"use client";

import {createClient} from "@/lib/supabase/client-with-offline";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {AccessCodeStep} from "@/components/auth/access-code-step";

type LoginStep = "credentials" | "access-code";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<LoginStep>("credentials");
  // Store resolved user data between steps
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const {data: signInData, error: signInError} = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      const {data: profile, error: profileError} = await supabase
        .from("profiles")
        .select("*")
        .eq("id", signInData.user.id)
        .single();

      if (profileError) throw profileError;

      // Determine where to redirect after code verification
      const hasCompletedStage1 =
        profile?.full_name &&
        profile?.phone &&
        profile?.date_of_birth &&
        profile?.address &&
        profile?.country;
      const hasCompletedStage2 =
        profile?.employment_status &&
        profile?.annual_income &&
        profile?.source_of_funds &&
        profile?.tax_residence_country;
      const hasCompletedOnboarding = hasCompletedStage1 && hasCompletedStage2;

      let redirect = "/dashboard";

      if (!hasCompletedOnboarding && profile?.role !== "admin") {
        redirect = "/auth/setup";
      } else if (profile?.role === "admin") {
        redirect = "/admin";
      } else {
        const {data: accounts} = await supabase
          .from("accounts")
          .select("id")
          .eq("user_id", signInData.user.id)
          .limit(1);

        if (!accounts || accounts.length === 0) {
          redirect = "/auth/account-setup";
        }
      }

      const requiresAccessCode = profile?.role !== "admin";
      if (!requiresAccessCode) {
        router.push(redirect);
        return;
      }
      setPendingRedirect(redirect);
      setStep("access-code");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeVerified = () => {
    router.push(pendingRedirect ?? "/dashboard");
  };

  const handleCodeCancelled = () => {
    // Sign out since credentials were valid but code was cancelled
    const supabase = createClient();
    supabase.auth.signOut();
    setStep("credentials");
    setPendingRedirect(null);
    setError("Login cancelled. Please sign in again.");
  };

  // ── Access code step ──────────────────────────────────────────────────
  if (step === "access-code") {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardContent className="pt-6">
              <AccessCodeStep
                onVerified={handleCodeVerified}
                onCancel={handleCodeCancelled}
                email={email}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Credentials step ──────────────────────────────────────────────────
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>Enter your email below to login to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Verifying..." : "Continue"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Don&apos;t have an account?{" "}
                  <Link href="/auth/sign-up" className="underline underline-offset-4">
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
