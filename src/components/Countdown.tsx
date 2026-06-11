"use client";

import { useEffect, useState } from "react";
import { Lock, Timer } from "lucide-react";
import { formatCountdown } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Live kickoff countdown. Ticks every second; flips to a "Locked" state once
 * kickoff passes. Renders nothing time-sensitive on the server to avoid
 * hydration mismatches (starts from kickoffMs - Date.now() on mount).
 */
export function Countdown({
  kickoffMs,
  className,
  onLock,
}: {
  kickoffMs: number;
  className?: string;
  onLock?: () => void;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const msUntil = now === null ? kickoffMs - Date.now() : kickoffMs - now;
  const locked = msUntil <= 0;

  useEffect(() => {
    if (locked) onLock?.();
  }, [locked, onLock]);

  if (locked) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground",
          className,
        )}
      >
        <Lock className="size-3.5" />
        Cerrado
      </span>
    );
  }

  // Suppress hydration mismatch: render a stable label until mounted.
  return (
    <span
      suppressHydrationWarning
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold tabular-nums",
        msUntil < 1000 * 60 * 60 ? "text-accent-foreground" : "text-primary",
        className,
      )}
    >
      <Timer className="size-3.5" />
      {now === null ? "—" : formatCountdown(msUntil)}
    </span>
  );
}
