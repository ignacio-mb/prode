"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarX2, ChevronLeft, ChevronRight } from "lucide-react";
import { MatchCard } from "./MatchCard";
import type { ClientMatch } from "./types";
import { dayChipParts, dayKey } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Day {
  key: string; // full label, e.g. "jueves, 11 de junio"
  date: Date; // representative (first kickoff that day)
  matches: ClientMatch[];
  hasOpen: boolean; // any match this day still awaiting the user's pick
}

export function MatchList({
  matches,
  playerCount,
}: {
  matches: ClientMatch[];
  playerCount: number;
}) {
  // Group into days (matches arrive ordered by kickoff, so days stay chronological).
  const days = useMemo<Day[]>(() => {
    const now = Date.now();
    const map = new Map<string, Day>();
    for (const m of matches) {
      const d = new Date(m.kickoffMs);
      const key = dayKey(d);
      let day = map.get(key);
      if (!day) {
        day = { key, date: d, matches: [], hasOpen: false };
        map.set(key, day);
      }
      day.matches.push(m);
      if (
        m.status !== "finished" &&
        m.kickoffMs > now &&
        m.myPrediction === null
      ) {
        day.hasOpen = true;
      }
    }
    return [...map.values()];
  }, [matches]);

  // Default to the first day that still has an upcoming match (else the last).
  const defaultIdx = useMemo(() => {
    const now = Date.now();
    const i = days.findIndex((d) => d.matches.some((m) => m.kickoffMs > now));
    return i === -1 ? Math.max(0, days.length - 1) : i;
  }, [days]);

  const [selectedIdx, setSelectedIdx] = useState(defaultIdx);
  const idx = Math.min(selectedIdx, days.length - 1);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the selected day chip in view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [idx]);

  if (days.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
        <CalendarX2 className="size-10 opacity-50" />
        <p className="text-sm font-medium">No hay partidos cargados</p>
      </div>
    );
  }

  const day = days[idx];
  const todayKey = dayKey(new Date());

  return (
    <div className="space-y-4">
      {/* Day picker */}
      <div className="flex items-center gap-1">
        <button
          aria-label="Día anterior"
          disabled={idx === 0}
          onClick={() => setSelectedIdx((i) => Math.max(0, i - 1))}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground transition hover:text-foreground disabled:opacity-30"
        >
          <ChevronLeft className="size-5" />
        </button>

        <div className="flex flex-1 gap-2 overflow-x-auto px-0.5 py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {days.map((d, i) => {
            const parts = dayChipParts(d.date);
            const active = i === idx;
            const isToday = d.key === todayKey;
            return (
              <button
                key={d.key}
                ref={active ? activeRef : undefined}
                onClick={() => setSelectedIdx(i)}
                className={cn(
                  "relative flex w-14 shrink-0 flex-col items-center rounded-xl border py-1.5 transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:bg-secondary",
                )}
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase",
                    active ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {parts.weekday}
                </span>
                <span className="text-lg font-extrabold leading-none">
                  {parts.day}
                </span>
                <span
                  className={cn(
                    "text-[10px] uppercase",
                    active ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {parts.month}
                </span>
                {isToday && !active && (
                  <span className="absolute -top-1 right-1 rounded-full bg-accent px-1 text-[8px] font-bold uppercase text-accent-foreground">
                    hoy
                  </span>
                )}
                {d.hasOpen && (
                  <span
                    className={cn(
                      "absolute bottom-1 size-1.5 rounded-full",
                      active ? "bg-primary-foreground" : "bg-primary",
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        <button
          aria-label="Día siguiente"
          disabled={idx >= days.length - 1}
          onClick={() =>
            setSelectedIdx((i) => Math.min(days.length - 1, i + 1))
          }
          className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-muted-foreground transition hover:text-foreground disabled:opacity-30"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Selected day */}
      <section className="space-y-2.5">
        <h2 className="px-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {day.key} ·{" "}
          <span className="text-foreground">
            {day.matches.length}{" "}
            {day.matches.length === 1 ? "partido" : "partidos"}
          </span>
        </h2>
        <div className="space-y-2.5">
          {day.matches.map((m) => (
            <MatchCard key={m.id} match={m} playerCount={playerCount} />
          ))}
        </div>
      </section>
    </div>
  );
}
