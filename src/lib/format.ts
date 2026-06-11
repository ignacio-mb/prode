import type { Stage } from "@/db/schema";

export const STAGE_LABELS: Record<Stage, string> = {
  group: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-finals",
  semi_final: "Semi-finals",
  third_place: "Third-place Play-off",
  final: "Final",
};

export const STAGE_SHORT: Record<Stage, string> = {
  group: "Group",
  round_of_32: "R32",
  round_of_16: "R16",
  quarter_final: "QF",
  semi_final: "SF",
  third_place: "3rd",
  final: "Final",
};

/** e.g. "Thu, Jun 11 · 19:00" in the viewer's locale/timezone. */
export function formatKickoff(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Date-only key for grouping matches by calendar day in the viewer's tz. */
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function isLocked(kickoffAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= kickoffAt.getTime();
}

/** Compact countdown string from a millisecond delta. */
export function formatCountdown(msUntil: number): string {
  if (msUntil <= 0) return "Locked";
  const totalSeconds = Math.floor(msUntil / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}
