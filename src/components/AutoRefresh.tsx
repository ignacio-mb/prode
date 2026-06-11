"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Lightweight live updates: re-fetches server components on an interval and
 * when the tab regains focus. Used on the leaderboard + matches views.
 */
export function AutoRefresh({ intervalMs = 30000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [router, intervalMs]);

  return null;
}
