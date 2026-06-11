"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "prode:splash";
const MAX_PER_DAY = 3;

/** Local calendar date as YYYY-MM-DD. */
function todayKey(): string {
  return new Date().toLocaleDateString("en-CA");
}

/**
 * Full-screen intro splash, shown at most 3 times per day (per browser). The
 * count is tracked in localStorage and resets each calendar day. Closable early
 * via the X (or tapping anywhere). Lives in the root layout, so each full page
 * load counts as one "open". Tuned for mobile (portrait image, object-cover).
 */
export function Splash() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Decide whether to show, and record the view (max 3/day).
  useEffect(() => {
    const today = todayKey();
    let count = 0;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as { date?: string; count?: number };
        if (data.date === today) count = data.count ?? 0;
      }
    } catch {
      /* ignore */
    }

    if (count >= MAX_PER_DAY) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: today, count: count + 1 }),
      );
    } catch {
      /* ignore */
    }
    setOpen(true);
  }, []);

  // Auto-dismiss after ~2s.
  useEffect(() => {
    if (!open) return;
    const hide = setTimeout(() => setLeaving(true), 2000);
    return () => clearTimeout(hide);
  }, [open]);

  // Unmount shortly after the fade-out starts.
  useEffect(() => {
    if (!leaving) return;
    const done = setTimeout(() => setOpen(false), 350);
    return () => clearTimeout(done);
  }, [leaving]);

  if (!open) return null;

  return (
    <div
      className={
        "fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-300 " +
        (leaving ? "opacity-0" : "opacity-100")
      }
      onClick={() => setLeaving(true)}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={(e) => {
          e.stopPropagation();
          setLeaving(true);
        }}
        className="absolute right-4 z-10 flex size-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-95"
        style={{ top: "max(1rem, env(safe-area-inset-top))" }}
      >
        <X className="size-6" />
      </button>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/splash.png"
        alt=""
        className="h-full w-full object-cover"
        draggable={false}
      />
    </div>
  );
}
