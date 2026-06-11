"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Trophy,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Countdown } from "@/components/Countdown";
import { Confetti } from "@/components/Confetti";
import { savePredictionAction } from "@/app/actions/predictions";
import { formatKickoff } from "@/lib/format";
import { scoreKind } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { ClientMatch, ClientTeam } from "./types";

const MAX_GOALS = 30;

function TeamSide({
  team,
  label,
  align,
}: {
  team: ClientTeam | null;
  label: string | null;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        align === "right" && "flex-row-reverse text-right",
      )}
    >
      <span className="text-3xl leading-none" aria-hidden>
        {team?.flagEmoji ?? "🏳️"}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">
          {team?.name ?? label ?? "Por definir"}
        </div>
        {team?.fifaCode && (
          <div className="text-[11px] font-medium text-muted-foreground">
            {team.fifaCode}
          </div>
        )}
      </div>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  const clamp = (n: number) => Math.max(0, Math.min(MAX_GOALS, n));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        aria-label={`Increase ${ariaLabel}`}
        disabled={disabled}
        onClick={() => onChange(clamp(value + 1))}
        className="flex size-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground transition hover:bg-secondary/70 disabled:opacity-40"
      >
        <Plus className="size-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={MAX_GOALS}
        aria-label={ariaLabel}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="h-11 w-12 rounded-lg border border-input bg-background text-center text-2xl font-bold tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
      />
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel}`}
        disabled={disabled || value <= 0}
        onClick={() => onChange(clamp(value - 1))}
        className="flex size-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground transition hover:bg-secondary/70 disabled:opacity-40"
      >
        <Minus className="size-4" />
      </button>
    </div>
  );
}

export function MatchCard({
  match,
  playerCount,
}: {
  match: ClientMatch;
  playerCount: number;
}) {
  const initialLocked = match.kickoffMs <= Date.now();
  const [locked, setLocked] = useState(initialLocked);
  const [home, setHome] = useState<number>(match.myPrediction?.homeGoals ?? 0);
  const [away, setAway] = useState<number>(match.myPrediction?.awayGoals ?? 0);
  const [touched, setTouched] = useState(false);
  const [saved, setSaved] = useState<{ h: number; a: number } | null>(
    match.myPrediction
      ? { h: match.myPrediction.homeGoals, a: match.myPrediction.awayGoals }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confetti, setConfetti] = useState(0);

  const teamsKnown = !!match.homeTeam && !!match.awayTeam;
  const finished =
    match.status === "finished" &&
    match.homeScore !== null &&
    match.awayScore !== null;

  const dirty =
    !saved || saved.h !== home || saved.a !== away;

  const canSubmit = !locked && teamsKnown && (touched ? dirty : !saved);

  const submittedLabel = useMemo(() => {
    if (playerCount <= 0) return null;
    return `${match.predictionCount}/${playerCount} enviados`;
  }, [match.predictionCount, playerCount]);

  // Points earned (when finished + we predicted).
  const earned = useMemo(() => {
    if (!finished || !saved) return null;
    const kind = scoreKind(
      saved.h,
      saved.a,
      match.homeScore!,
      match.awayScore!,
    );
    return kind;
  }, [finished, saved, match.homeScore, match.awayScore]);

  function handleSave() {
    setError(null);
    const optimistic = { h: home, a: away };
    startTransition(async () => {
      const res = await savePredictionAction({
        matchId: match.id,
        homeGoals: home,
        awayGoals: away,
      });
      if (res.ok) {
        setSaved(optimistic);
        setTouched(false);
        setConfetti((c) => c + 1);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-shadow",
        finished && earned === "exact" && "ring-2 ring-accent",
      )}
    >
      <Confetti trigger={confetti} />
      <CardContent className="space-y-3 p-4">
        {/* meta row */}
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline">
              {match.groupLetter
                ? `Grupo ${match.groupLetter}`
                : match.stageLabel}
            </Badge>
            <span className="hidden items-center gap-1 sm:inline-flex">
              <MapPin className="size-3" />
              {match.venue.split(",")[0]}
            </span>
          </div>
          {match.status === "live" ? (
            <Badge variant="live" className="animate-pulse">
              ● LIVE
            </Badge>
          ) : (
            <Countdown
              kickoffMs={match.kickoffMs}
              onLock={() => setLocked(true)}
            />
          )}
        </div>

        {/* teams + score area */}
        <div className="flex items-center gap-3">
          <TeamSide team={match.homeTeam} label={match.homeLabel} align="left" />

          {finished ? (
            <div className="flex shrink-0 items-center gap-1 text-3xl font-extrabold tabular-nums">
              <span>{match.homeScore}</span>
              <span className="text-muted-foreground">:</span>
              <span>{match.awayScore}</span>
            </div>
          ) : teamsKnown ? (
            <div className="flex shrink-0 items-end gap-2">
              <Stepper
                value={home}
                disabled={locked || pending}
                ariaLabel={`${match.homeTeam?.name ?? "home"} goals`}
                onChange={(n) => {
                  setHome(n);
                  setTouched(true);
                }}
              />
              <span className="pb-3 text-xl font-bold text-muted-foreground">
                :
              </span>
              <Stepper
                value={away}
                disabled={locked || pending}
                ariaLabel={`${match.awayTeam?.name ?? "away"} goals`}
                onChange={(n) => {
                  setAway(n);
                  setTouched(true);
                }}
              />
            </div>
          ) : (
            <div className="shrink-0 px-2 text-center text-xs font-medium text-muted-foreground">
              Equipos
              <br />
              por definir
            </div>
          )}

          <TeamSide team={match.awayTeam} label={match.awayLabel} align="right" />
        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          {formatKickoff(new Date(match.kickoffMs))}
        </div>

        {/* action / status row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {submittedLabel && (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" />
                {submittedLabel}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {finished && earned && (
              <Badge
                variant={
                  earned === "exact"
                    ? "accent"
                    : earned === "outcome"
                      ? "success"
                      : "secondary"
                }
              >
                {earned === "exact" && <Trophy className="size-3.5" />}
                {earned === "exact"
                  ? "¡Exacto!"
                  : earned === "outcome"
                    ? "Acierto"
                    : "Errado"}
              </Badge>
            )}

            {!finished && !locked && teamsKnown && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!canSubmit || pending}
                variant={saved && !dirty ? "secondary" : "default"}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : saved && !dirty ? (
                  <Check className="size-4" />
                ) : null}
                {pending
                  ? "Guardando"
                  : saved
                    ? dirty
                      ? "Editar"
                      : "Guardado"
                    : "Enviar"}
              </Button>
            )}

            {(locked || finished) && (
              <Link
                href={`/matches/${match.id}`}
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                Pronósticos
                <ChevronRight className="size-4" />
              </Link>
            )}
          </div>
        </div>

        {error && (
          <p className="text-center text-xs font-medium text-destructive">
            {error}
          </p>
        )}
        {locked && !finished && saved && (
          <p className="text-center text-[11px] text-muted-foreground">
            Tu pronóstico: {saved.h}–{saved.a} · cerrado al inicio
          </p>
        )}
      </CardContent>
    </Card>
  );
}
