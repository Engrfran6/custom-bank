"use client";

import {useState} from "react";
import {useUpdatePassword} from "@/lib/hooks/use-settings";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {CheckCircle2, Eye, EyeOff, Loader2, Lock} from "lucide-react";

export function SettingsPassword() {
  const {update, loading, error, success} = useUpdatePassword();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const mismatch = next && confirm && next !== confirm;
  const tooShort = next && next.length < 8;
  const canSubmit = current && next && confirm && !mismatch && !tooShort;

  const strength = (() => {
    if (!next) return 0;
    let s = 0;
    if (next.length >= 8) s++;
    if (/[A-Z]/.test(next)) s++;
    if (/[0-9]/.test(next)) s++;
    if (/[^A-Za-z0-9]/.test(next)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"][
    strength
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const ok = await update({current_password: current, new_password: next});
    if (ok !== undefined) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Current password */}
      <div className="grid gap-1.5">
        <Label htmlFor="current_pw">Current Password</Label>
        <div className="relative">
          <Input
            id="current_pw"
            type={showCurr ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => setShowCurr(!showCurr)}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
            {showCurr ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* New password */}
      <div className="grid gap-1.5">
        <Label htmlFor="new_pw">New Password</Label>
        <div className="relative">
          <Input
            id="new_pw"
            type={showNext ? "text" : "password"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            placeholder="Enter new password"
          />
          <button
            type="button"
            onClick={() => setShowNext(!showNext)}
            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground">
            {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Strength meter */}
        {next && (
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              {Array.from({length: 4}).map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i < strength ? strengthColor : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p
              className={`text-xs font-medium ${
                strength <= 1
                  ? "text-red-500"
                  : strength === 2
                    ? "text-yellow-600"
                    : strength === 3
                      ? "text-blue-600"
                      : "text-emerald-600"
              }`}>
              {strengthLabel}
            </p>
          </div>
        )}

        {tooShort && <p className="text-xs text-red-500">Password must be at least 8 characters</p>}
      </div>

      {/* Confirm password */}
      <div className="grid gap-1.5">
        <Label htmlFor="confirm_pw">Confirm New Password</Label>
        <Input
          id="confirm_pw"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
        />
        {mismatch && <p className="text-xs text-red-500">Passwords do not match</p>}
      </div>

      {/* Requirements */}
      <div className="rounded-xl border border-border bg-muted/40 p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Password requirements</p>
        <div className="grid grid-cols-2 gap-1">
          {[
            {label: "At least 8 characters", met: next.length >= 8},
            {label: "One uppercase letter", met: /[A-Z]/.test(next)},
            {label: "One number", met: /[0-9]/.test(next)},
            {label: "One special character", met: /[^A-Za-z0-9]/.test(next)},
          ].map((req) => (
            <div key={req.label} className="flex items-center gap-1.5 text-xs">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  req.met ? "bg-emerald-500" : "bg-muted-foreground/40"
                }`}
              />
              <span
                className={
                  req.met ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                }>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!canSubmit || loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Lock className="mr-2 h-4 w-4" />
          )}
          Update Password
        </Button>
        {success && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Password updated
          </span>
        )}
      </div>
    </form>
  );
}
