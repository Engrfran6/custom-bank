// components/admin/countdown-cell.tsx
"use client";

import {useState, useEffect} from "react";
import {useMounted} from "@/lib/hooks/use-mounted";

export function CountdownCell({expiresAt, status}: {expiresAt: string; status: string}) {
  const mounted = useMounted();
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (status !== "pending") return;
    const tick = () =>
      setSecs(Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt, status]);

  if (!mounted || status !== "pending")
    return <span className="text-muted-foreground text-xs">—</span>;
  if (secs === 0) return <span className="text-red-500 text-xs">Expired</span>;

  const mins = Math.floor(secs / 60);
  const rem = secs % 60;

  return (
    <span className={`font-mono text-xs ${secs < 60 ? "text-red-500" : "text-amber-600"}`}>
      {mins}:{rem.toString().padStart(2, "0")}
    </span>
  );
}
