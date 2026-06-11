"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "#ef4444",
  "#3b82f6",
];

/**
 * A tiny celebratory confetti burst. Re-fires whenever `trigger` increments
 * (e.g. when a saved prediction is an exact-score hit, or on a confirmed win).
 */
export function Confetti({ trigger }: { trigger: number }) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (trigger <= 0) return;
    setActive(true);
    const id = setTimeout(() => setActive(false), 1100);
    return () => clearTimeout(id);
  }, [trigger]);

  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-20 overflow-visible"
    >
      {Array.from({ length: 18 }).map((_, i) => {
        const left = (i * 53) % 100;
        const delay = (i % 6) * 40;
        const color = COLORS[i % COLORS.length];
        return (
          <span
            key={i}
            className="confetti-piece animate-confetti"
            style={{
              left: `${left}%`,
              backgroundColor: color,
              animationDelay: `${delay}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
