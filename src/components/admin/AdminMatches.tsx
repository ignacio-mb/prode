"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, RadioTower, RotateCcw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  assignTeamsAction,
  clearResultAction,
  saveResultAction,
  setLiveAction,
} from "@/app/actions/admin";
import { formatKickoff } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClientMatch } from "@/components/match/types";

export interface AdminTeamOption {
  id: number;
  name: string;
  flagEmoji: string;
  groupLetter: string | null;
}

const STAGE_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "todo", label: "Falta resultado" },
  { key: "group", label: "Grupos" },
  { key: "round_of_32", label: "16avos" },
  { key: "round_of_16", label: "8vos" },
  { key: "quarter_final", label: "4tos" },
  { key: "semi_final", label: "Semis" },
  { key: "final", label: "Final" },
] as const;

export function AdminMatches({
  matches,
  teams,
}: {
  matches: ClientMatch[];
  teams: AdminTeamOption[];
}) {
  const [filter, setFilter] =
    useState<(typeof STAGE_FILTERS)[number]["key"]>("todo");

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (filter === "all") return true;
      if (filter === "todo")
        return m.status !== "finished" && m.kickoffMs <= Date.now() + 1;
      if (filter === "final")
        return m.stage === "final" || m.stage === "third_place";
      return m.stage === filter;
    });
  }, [matches, filter]);

  return (
    <div className="space-y-3">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STAGE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          Nada por acá.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((m) => (
            <AdminMatchRow key={m.id} match={m} teams={teams} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AdminMatchRow({
  match,
  teams,
}: {
  match: ClientMatch;
  teams: AdminTeamOption[];
}) {
  const [home, setHome] = useState<string>(
    match.homeScore !== null ? String(match.homeScore) : "",
  );
  const [away, setAway] = useState<string>(
    match.awayScore !== null ? String(match.awayScore) : "",
  );
  const [homeTeamId, setHomeTeamId] = useState<number | null>(
    match.homeTeam?.id ?? null,
  );
  const [awayTeamId, setAwayTeamId] = useState<number | null>(
    match.awayTeam?.id ?? null,
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const isKnockout = match.groupLetter === null;
  const homeName = match.homeTeam?.name ?? match.homeLabel ?? "Por definir";
  const awayName = match.awayTeam?.name ?? match.awayLabel ?? "Por definir";

  function flash(text: string) {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  }

  function saveResult() {
    const h = Number(home);
    const a = Number(away);
    if (home === "" || away === "" || !Number.isInteger(h) || !Number.isInteger(a)) {
      flash("Cargá ambos resultados");
      return;
    }
    start(async () => {
      const res = await saveResultAction({
        matchId: match.id,
        homeScore: h,
        awayScore: a,
      });
      flash(res.ok ? "Resultado guardado ✓" : res.error);
    });
  }

  function clearResult() {
    start(async () => {
      const res = await clearResultAction({ matchId: match.id });
      if (res.ok) {
        setHome("");
        setAway("");
      }
      flash(res.ok ? "Borrado" : res.error);
    });
  }

  function toggleLive() {
    start(async () => {
      const res = await setLiveAction({
        matchId: match.id,
        live: match.status !== "live",
      });
      flash(res.ok ? "Actualizado" : res.error);
    });
  }

  function assign(nextHome: number | null, nextAway: number | null) {
    setHomeTeamId(nextHome);
    setAwayTeamId(nextAway);
    start(async () => {
      const res = await assignTeamsAction({
        matchId: match.id,
        homeTeamId: nextHome,
        awayTeamId: nextAway,
      });
      flash(res.ok ? "Equipos asignados" : res.error);
    });
  }

  return (
    <Card>
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span>
            #{match.matchNumber} ·{" "}
            {match.groupLetter
              ? `Grupo ${match.groupLetter}`
              : match.stageLabel}
          </span>
          <span className="flex items-center gap-2">
            {match.status === "finished" && (
              <Badge variant="success">Finalizado</Badge>
            )}
            {match.status === "live" && (
              <Badge variant="live">● LIVE</Badge>
            )}
            {formatKickoff(new Date(match.kickoffMs))}
          </span>
        </div>

        {/* Knockout team assignment */}
        {isKnockout && (
          <div className="grid grid-cols-2 gap-2">
            <TeamSelect
              label={match.homeLabel ?? "Local"}
              value={homeTeamId}
              teams={teams}
              onChange={(id) => assign(id, awayTeamId)}
            />
            <TeamSelect
              label={match.awayLabel ?? "Visitante"}
              value={awayTeamId}
              teams={teams}
              onChange={(id) => assign(homeTeamId, id)}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold">
            {match.homeTeam?.flagEmoji ?? "🏳️"} {homeName}
          </span>
          <Input
            type="number"
            min={0}
            aria-label={`${homeName} score`}
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="h-10 w-14 text-center text-lg font-bold"
          />
          <span className="text-muted-foreground">:</span>
          <Input
            type="number"
            min={0}
            aria-label={`${awayName} score`}
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="h-10 w-14 text-center text-lg font-bold"
          />
          <span className="min-w-0 flex-1 truncate text-right text-sm font-semibold">
            {awayName} {match.awayTeam?.flagEmoji ?? "🏳️"}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{msg}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleLive}
              disabled={pending || match.status === "finished"}
              title="Toggle live"
            >
              <RadioTower className="size-4" />
            </Button>
            {match.status === "finished" && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearResult}
                disabled={pending}
              >
                <RotateCcw className="size-4" />
                Borrar
              </Button>
            )}
            <Button size="sm" onClick={saveResult} disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : match.status === "finished" ? (
                <Check className="size-4" />
              ) : (
                <Save className="size-4" />
              )}
              {match.status === "finished" ? "Actualizar" : "Guardar"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamSelect({
  label,
  value,
  teams,
  onChange,
}: {
  label: string;
  value: number | null;
  teams: AdminTeamOption[];
  onChange: (id: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block truncate text-[10px] uppercase text-muted-foreground">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="h-9 w-full rounded-lg border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">— elegí equipo —</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.flagEmoji} {t.name}
            {t.groupLetter ? ` (${t.groupLetter})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
