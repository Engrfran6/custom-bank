"use client";

import {createClient} from "@/lib/supabase/client-with-offline";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import Link from "next/link";
import {useState} from "react";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const {error} = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback?next=/auth/setup`,
        },
      });
      if (error) throw error;
      setEmailSent(true); // ← swap the card content, no redirect needed
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            {!emailSent ? (
              <>
                <CardHeader>
                  <CardTitle className="text-2xl">Sign up</CardTitle>
                  <CardDescription>Create a new account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignUp}>
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
                      <div className="grid gap-2">
                        <Label htmlFor="repeat-password">Repeat Password</Label>
                        <Input
                          id="repeat-password"
                          type="password"
                          required
                          value={repeatPassword}
                          onChange={(e) => setRepeatPassword(e.target.value)}
                        />
                      </div>
                      {error && <p className="text-sm text-red-500">{error}</p>}
                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Creating an account..." : "Sign up"}
                      </Button>
                    </div>
                    <div className="mt-4 text-center text-sm">
                      Already have an account?{" "}
                      <Link href="/auth/login" className="underline underline-offset-4">
                        Login
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <CardTitle className="text-2xl">Check your email</CardTitle>
                  <CardDescription>
                    We sent a verification link to{" "}
                    <span className="font-medium text-foreground">{email}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4 text-sm text-muted-foreground">
                    <p>
                      Click the link in the email to verify your account and we&apos;ll finish
                      setting everything up for you.
                    </p>
                    <p>
                      Wrong email?{" "}
                      <button
                        onClick={() => setEmailSent(false)}
                        className="text-foreground underline underline-offset-4">
                        Go back
                      </button>
                    </p>
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
