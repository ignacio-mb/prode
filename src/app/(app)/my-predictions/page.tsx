import Link from "next/link";
import { ChevronRight, ListChecks, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyPredictions } from "@/lib/queries";
import { STAGE_LABELS, formatKickoff } from "@/lib/format";
import { scoreKind } from "@/lib/scoring";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyPredictionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const rows = await getMyPredictions(user.id);

  const finished = rows.filter(
    (r) => r.match.status === "finished" && r.points !== null,
  );
  const totalPoints = finished.reduce((s, r) => s + (r.points ?? 0), 0);
  const exactHits = finished.filter(
    (r) =>
      r.match.homeScore !== null &&
      scoreKind(
        r.homeGoals,
        r.awayGoals,
        r.match.homeScore,
        r.match.awayScore!,
      ) === "exact",
  ).length;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Mis pronósticos</h1>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Pronós" value={rows.length} />
        <Stat label="Puntos" value={totalPoints} accent />
        <Stat label="Exactos" value={exactHits} />
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <ListChecks className="size-10 opacity-50" />
            <p className="text-sm font-medium">Todavía no hiciste pronósticos</p>
            <Link
              href="/matches"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Hacé tu primer pronóstico →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => {
            const isFinished =
              r.match.status === "finished" && r.match.homeScore !== null;
            const kind = isFinished
              ? scoreKind(
                  r.homeGoals,
                  r.awayGoals,
                  r.match.homeScore!,
                  r.match.awayScore!,
                )
              : null;
            return (
              <li key={r.match.id}>
                <Link href={`/matches/${r.match.id}`}>
                  <Card className="transition-colors hover:bg-secondary/40">
                    <CardContent className="flex items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-semibold">
                          <span aria-hidden>{r.homeTeam?.flagEmoji ?? "🏳️"}</span>
                          <span className="truncate">
                            {r.homeTeam?.fifaCode ?? "—"}
                          </span>
                          <span className="text-muted-foreground">v</span>
                          <span className="truncate">
                            {r.awayTeam?.fifaCode ?? "—"}
                          </span>
                          <span aria-hidden>{r.awayTeam?.flagEmoji ?? "🏳️"}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.match.groupLetter
                            ? `Grupo ${r.match.groupLetter}`
                            : STAGE_LABELS[r.match.stage]}{" "}
                          · {formatKickoff(new Date(r.match.kickoffAt))}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-[10px] uppercase text-muted-foreground">
                          Tu pron.
                        </div>
                        <div className="text-base font-bold tabular-nums">
                          {r.homeGoals}–{r.awayGoals}
                        </div>
                      </div>

                      {isFinished && (
                        <div className="text-center">
                          <div className="text-[10px] uppercase text-muted-foreground">
                            Resultado
                          </div>
                          <div className="text-base font-bold tabular-nums">
                            {r.match.homeScore}–{r.match.awayScore}
                          </div>
                        </div>
                      )}

                      <div className="w-14 text-right">
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
                            {r.points ?? 0}
                          </Badge>
                        ) : (
                          <ChevronRight className="ml-auto size-4 text-muted-foreground" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-3 text-center">
        <div
          className={cn(
            "text-2xl font-extrabold tabular-nums",
            accent && "text-primary",
          )}
        >
          {value}
        </div>
        <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}
