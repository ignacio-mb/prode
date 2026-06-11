"use client";

import { useEffect, useState } from "react";
import { MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Countdown } from "@/components/Countdown";
import { Confetti } from "@/components/Confetti";
import { formatKickoff } from "@/lib/format";
import { scoreKind } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import type { ClientTeam } from "./types";

interface DetailPrediction {
  userId: number;
  userName: string;
  homeGoals: number;
  awayGoals: number;
  points: number | null;
}

export interface MatchDetailData {
  id: number;
  stageLabel: string;
  groupLetter: string | null;
  homeTeam: ClientTeam | null;
  awayTeam: ClientTeam | null;
  homeLabel: string | null;
  awayLabel: string | null;
  kickoffMs: number;
  venue: string;
  status: "scheduled" | "live" | "finished";
  homeScore: number | null;
  awayScore: number | null;
  predictions: DetailPrediction[];
}

export function MatchDetailView({
  data,
  currentUserId,
}: {
  data: MatchDetailData;
  currentUserId: number;
}) {
  const finished =
    data.status === "finished" &&
    data.homeScore !== null &&
    data.awayScore !== null;
  const locked = finished || data.kickoffMs <= Date.now();

  const mine = data.predictions.find((p) => p.userId === currentUserId);
  const myExact =
    finished &&
    mine &&
    scoreKind(mine.homeGoals, mine.awayGoals, data.homeScore!, data.awayScore!) ===
      "exact";

  const [confetti, setConfetti] = useState(0);
  useEffect(() => {
    if (myExact) setConfetti(1);
  }, [myExact]);

  const home = data.homeTeam?.name ?? data.homeLabel ?? "TBD";
  const away = data.awayTeam?.name ?? data.awayLabel ?? "TBD";

  return (
    <div className="space-y-4">
      <Card className="relative overflow-hidden">
        <Confetti trigger={confetti} />
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <Badge variant="outline">
              {data.groupLetter ? `Group ${data.groupLetter}` : data.stageLabel}
            </Badge>
            {data.status === "live" ? (
              <Badge variant="live" className="animate-pulse">
                ● LIVE
              </Badge>
            ) : finished ? (
              <Badge variant="secondary">Full time</Badge>
            ) : (
              <Countdown kickoffMs={data.kickoffMs} />
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-1 flex-col items-center gap-1 text-center">
              <span className="text-4xl" aria-hidden>
                {data.homeTeam?.flagEmoji ?? "🏳️"}
              </span>
              <span className="text-sm font-semibold leading-tight">{home}</span>
            </div>
            <div className="shrink-0 text-center">
              {finished ? (
                <div className="text-4xl font-extrabold tabular-nums">
                  {data.homeScore}
                  <span className="mx-1 text-muted-foreground">:</span>
                  {data.awayScore}
                </div>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">vs</div>
              )}
            </div>
            <div className="flex flex-1 flex-col items-center gap-1 text-center">
              <span className="text-4xl" aria-hidden>
                {data.awayTeam?.flagEmoji ?? "🏳️"}
              </span>
              <span className="text-sm font-semibold leading-tight">{away}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="size-3" />
            {data.venue} · {formatKickoff(new Date(data.kickoffMs))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 px-0.5 text-sm font-bold">
          Predictions{" "}
          <span className="font-normal text-muted-foreground">
            ({data.predictions.length})
          </span>
        </h2>

        {!locked ? (
          <p className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">
            Predictions are visible once everyone&apos;s in — full table here.
            This match isn&apos;t locked yet, so picks can still change until
            kickoff.
          </p>
        ) : data.predictions.length === 0 ? (
          <p className="rounded-lg border bg-card p-4 text-center text-sm text-muted-foreground">
            No one predicted this match.
          </p>
        ) : (
          <Card>
            <ul className="divide-y">
              {data.predictions.map((p) => {
                const kind = finished
                  ? scoreKind(
                      p.homeGoals,
                      p.awayGoals,
                      data.homeScore!,
                      data.awayScore!,
                    )
                  : null;
                const isMe = p.userId === currentUserId;
                return (
                  <li
                    key={p.userId}
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-2.5",
                      isMe && "bg-primary/5",
                    )}
                  >
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        isMe ? "font-bold" : "font-medium",
                      )}
                    >
                      {p.userName}
                      {isMe && (
                        <span className="ml-1 text-xs text-primary">(you)</span>
                      )}
                    </span>
                    <span className="shrink-0 text-base font-bold tabular-nums">
                      {p.homeGoals}–{p.awayGoals}
                    </span>
                    <span className="w-16 shrink-0 text-right">
                      {kind ? (
                        <Badge
                          variant={
                            kind === "exact"
                              ? "accent"
                              : kind === "outcome"
                                ? "success"
                                : "secondary"
                          }
                        >
                          {kind === "exact" && <Trophy className="size-3" />}+
                          {p.points ?? 0}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
