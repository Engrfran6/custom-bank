// ─── helpers ─────────────────────────────────────────────────────────────────

import {Building2, CheckCircle2, Globe, Landmark} from "lucide-react";
import {cn} from "./utils/utils";

export type Step = "form" | "confirm" | "processing" | "done";
export type TransferType = "domestic" | "wire" | "international";

export const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"}).format(n);

export function calcFee(type: TransferType, amount: number, isInternal: boolean): number {
  if (isInternal) return 0;
  if (type === "domestic") return Math.min(Math.max(amount * 0.005, 0.5), 25);
  if (type === "wire") return 15;
  return Math.min(Math.max(amount * 0.01, 5), 50);
}

export function avatarColor(name: string) {
  const palettes = [
    "bg-blue-500/20 text-blue-400",
    "bg-violet-500/20 text-violet-400",
    "bg-emerald-500/20 text-emerald-400",
    "bg-amber-500/20 text-amber-400",
    "bg-rose-500/20 text-rose-400",
    "bg-cyan-500/20 text-cyan-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palettes[Math.abs(hash) % palettes.length];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── shared field wrapper ─────────────────────────────────────────────────────

export function Field({
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
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium uppercase tracking-[0.6px] text-[#5A6070]">
          {label}
          {required && <span className="ml-0.5 text-red-400">*</span>}
        </label>
        {optional && <span className="text-[11px] text-[#5A6070]">Optional</span>}
      </div>
      {children}
      {hint && <p className="text-[11px] text-[#5A6070]">{hint}</p>}
    </div>
  );
}

// ─── input ────────────────────────────────────────────────────────────────────

export function StyledInput({
  prefix,
  suffix,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}) {
  return (
    <div className="relative flex items-center">
      {prefix && <span className="absolute left-3 flex items-center text-[#5A6070]">{prefix}</span>}
      <input
        {...props}
        className={cn(
          "w-full rounded-lg border border-white/[0.08] bg-[#181B22] py-2.5 text-[13px] text-[#F0F2F7] placeholder-[#5A6070] outline-none transition",
          "focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20",
          prefix ? "pl-9" : "pl-3",
          suffix ? "pr-9" : "pr-3",
          className,
        )}
      />
      {suffix && <span className="absolute right-3 flex items-center">{suffix}</span>}
    </div>
  );
}

// ─── transfer type tab ────────────────────────────────────────────────────────

export const TRANSFER_TYPES: {
  value: TransferType;
  label: string;
  icon: React.ElementType;
  desc: string;
}[] = [
  {value: "domestic", label: "Domestic", icon: Landmark, desc: "Same-country transfer"},
  {value: "wire", label: "Wire", icon: Building2, desc: "Bank-to-bank wire"},
  {value: "international", label: "International", icon: Globe, desc: "Cross-border transfer"},
];

// ─── step indicator ───────────────────────────────────────────────────────────

export function StepBar({step}: {step: Step}) {
  const steps: Step[] = ["form", "confirm", "processing", "done"];
  const labels = ["Details", "Review", "Sending", "Done"];
  const idx = steps.indexOf(step);

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-all",
                i < idx
                  ? "bg-blue-500 text-white"
                  : i === idx
                    ? "border-2 border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border border-white/[0.08] bg-[#181B22] text-[#5A6070]",
              )}>
              {i < idx ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
            </div>
            <span
              className={cn(
                "text-[10px] font-medium",
                i === idx ? "text-blue-400" : "text-[#5A6070]",
              )}>
              {labels[i]}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "mb-4 h-px w-10 transition-colors",
                i < idx ? "bg-blue-500" : "bg-white/[0.06]",
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
