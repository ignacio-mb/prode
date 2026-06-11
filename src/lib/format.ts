import type { Stage } from "@/db/schema";

// Everyone sees the schedule in Argentina time, in Spanish.
const LOCALE = "es-AR";
const TIME_ZONE = "America/Argentina/Buenos_Aires";

export const STAGE_LABELS: Record<Stage, string> = {
  group: "Fase de grupos",
  round_of_32: "Dieciseisavos de final",
  round_of_16: "Octavos de final",
  quarter_final: "Cuartos de final",
  semi_final: "Semifinales",
  third_place: "Tercer puesto",
  final: "Final",
};

export const STAGE_SHORT: Record<Stage, string> = {
  group: "Grupo",
  round_of_32: "16avos",
  round_of_16: "8vos",
  quarter_final: "4tos",
  semi_final: "Semis",
  third_place: "3er",
  final: "Final",
};

/** e.g. "jue, 11 jun · 16:00" in Argentina time. */
export function formatKickoff(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  }).format(date);
}

/** Date-only key for grouping matches by calendar day (Argentina time). */
export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: TIME_ZONE,
  }).format(date);
}

/** Calendar-tile parts for a day chip (Argentina time): { weekday, day, month }. */
export function dayChipParts(date: Date): {
  weekday: string;
  day: string;
  month: string;
} {
  const part = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(LOCALE, { timeZone: TIME_ZONE, ...opts }).format(
      date,
    );
  return {
    weekday: part({ weekday: "short" }),
    day: part({ day: "numeric" }),
    month: part({ month: "short" }),
  };
}

export function isLocked(kickoffAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= kickoffAt.getTime();
}

/** Compact countdown string from a millisecond delta. */
export function formatCountdown(msUntil: number): string {
  if (msUntil <= 0) return "Cerrado";
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
