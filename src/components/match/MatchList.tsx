"use client";

import { useMemo, useState } from "react";
import { CalendarX2 } from "lucide-react";
import { MatchCard } from "./MatchCard";
import type { ClientMatch } from "./types";
import { dayKey } from "@/lib/format";
import { cn } from "@/lib/utils";

type Filter =
  | "all"
  | "open"
  | "finished"
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "final";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "open", label: "Abiertos" },
  { key: "finished", label: "Jugados" },
  { key: "group", label: "Grupos" },
  { key: "round_of_32", label: "16avos" },
  { key: "round_of_16", label: "8vos" },
  { key: "quarter_final", label: "4tos" },
  { key: "semi_final", label: "Semis" },
  { key: "final", label: "Final" },
];

export function MatchList({
  matches,
  playerCount,
}: {
  matches: ClientMatch[];
  playerCount: number;
}) {
  const [filter, setFilter] = useState<Filter>("open");

  const filtered = useMemo(() => {
    const now = Date.now();
    const list = matches.filter((m) => {
      switch (filter) {
        case "all":
          return true;
        case "open":
          return m.status !== "finished" && m.kickoffMs > now;
        case "finished":
          return m.status === "finished";
        case "final":
          return m.stage === "final" || m.stage === "third_place";
        default:
          return m.stage === filter;
      }
    });
    // If "open" is empty (e.g. tournament over), fall back to all.
    return list;
  }, [matches, filter]);

  // Group by calendar day (viewer's tz).
  const groups = useMemo(() => {
    const map = new Map<string, ClientMatch[]>();
    for (const m of filtered) {
      const key = dayKey(new Date(m.kickoffMs));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
          <CalendarX2 className="size-10 opacity-50" />
          <p className="text-sm font-medium">No hay partidos acá</p>
          <p className="text-xs">
            {filter === "open"
              ? "Nada abierto ahora — probá otro filtro."
              : "Probá otro filtro."}
          </p>
        </div>
      ) : (
        groups.map(([day, dayMatches]) => (
          <section key={day} className="space-y-2.5">
            <h2 className="px-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {day}
            </h2>
            <div className="space-y-2.5">
              {dayMatches.map((m) => (
                <MatchCard key={m.id} match={m} playerCount={playerCount} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
