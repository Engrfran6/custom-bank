"use client";

import {useState} from "react";
import {cn} from "@/lib/utils/utils";
import type {CardWithAccount} from "@/lib/hooks/use-card";
import {Eye, EyeOff, Snowflake, Wifi} from "lucide-react";

interface VirtualCardProps {
  card: CardWithAccount;
  selected?: boolean;
  onClick?: () => void;
}

const cardGradients = {
  debit: "from-slate-800 via-slate-700 to-slate-900",
  credit: "from-violet-800 via-purple-700 to-indigo-900",
};

export function VirtualCard({card, selected, onClick}: VirtualCardProps) {
  const [revealed, setRevealed] = useState(false);

  const maskedNumber = card.card_number
    .split(" ")
    .map((group, i) => (i === 3 ? group : "••••"))
    .join(" ");

  const displayNumber = revealed ? card.card_number : maskedNumber;
  const expiry = `${String(card.expiry_month).padStart(2, "0")}/${String(card.expiry_year).slice(-2)}`;

  const isFrozen = card.status === "frozen";
  const isCancelled = card.status === "cancelled";

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative cursor-pointer overflow-hidden rounded-2xl p-6 text-white shadow-xl transition-all duration-300",
        `bg-gradient-to-br ${cardGradients[card.card_type]}`,
        selected && "ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02]",
        isFrozen && "opacity-70",
        isCancelled && "opacity-40 grayscale",
      )}
      style={{aspectRatio: "1.586"}}>
      {/* Frozen overlay */}
      {isFrozen && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-950/60 backdrop-blur-[1px]">
          <div className="flex flex-col items-center gap-1">
            <Snowflake className="h-8 w-8 text-blue-200 animate-pulse" />
            <span className="text-xs font-semibold text-blue-200 tracking-widest uppercase">
              Frozen
            </span>
          </div>
        </div>
      )}

      {/* Background circles */}
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/5" />
      <div className="absolute -bottom-10 -left-6 h-48 w-48 rounded-full bg-white/5" />

      {/* Card content */}
      <div className="relative flex h-full flex-col justify-between">
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
              NeoBank
            </p>
            <p className="mt-0.5 text-xs capitalize text-white/70">{card.card_type} Card</p>
          </div>
          <Wifi className="h-5 w-5 rotate-90 text-white/60" />
        </div>

        {/* Chip */}
        <div className="h-8 w-12 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner" />

        {/* Card number */}
        <div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm tracking-widest">{displayNumber}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRevealed(!revealed);
              }}
              className="rounded p-1 hover:bg-white/10 transition-colors">
              {revealed ? (
                <EyeOff className="h-3.5 w-3.5 text-white/60" />
              ) : (
                <Eye className="h-3.5 w-3.5 text-white/60" />
              )}
            </button>
          </div>

          {/* Bottom row */}
          <div className="mt-2 flex items-end justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-wider text-white/40">Card Holder</p>
              <p className="text-xs font-medium">
                {card.account.account_type.charAt(0).toUpperCase() +
                  card.account.account_type.slice(1)}{" "}
                Account
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider text-white/40">Expires</p>
              <p className="text-xs font-medium">{expiry}</p>
            </div>
            <div className="flex -space-x-2">
              <div className="h-7 w-7 rounded-full bg-red-500/80" />
              <div className="h-7 w-7 rounded-full bg-yellow-500/80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
