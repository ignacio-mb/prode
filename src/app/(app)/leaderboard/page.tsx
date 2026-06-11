import { Crown, Medal, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AutoRefresh } from "@/components/AutoRefresh";
import { getCurrentUser } from "@/lib/auth";
import { getLeaderboard, getSettings } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MEDAL = ["text-accent-foreground", "text-zinc-400", "text-amber-700"];

export default async function LeaderboardPage() {
  const [rows, settings, user] = await Promise.all([
    getLeaderboard(),
    getSettings(),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-4">
      <AutoRefresh intervalMs={30000} />
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Tabla</h1>
        <span className="text-xs text-muted-foreground">
          {settings.exactPoints} exacto · {settings.outcomePoints} resultado
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
          Todavía no hay jugadores. ¡Sé el primero en pronosticar!
        </p>
      ) : (
        <Card className="overflow-hidden">
          <div className="flex items-center gap-3 border-b bg-secondary/50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            <span className="w-6 text-center">#</span>
            <span className="flex-1">Jugador</span>
            <span className="w-10 text-center" title="Exact scores">
              <Target className="mx-auto size-3.5" />
            </span>
            <span className="w-12 text-right">Pts</span>
          </div>
          <ul className="divide-y">
            {rows.map((r) => {
              const isMe = user?.id === r.userId;
              return (
                <li
                  key={r.userId}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    isMe && "bg-primary/5",
                  )}
                >
                  <span className="flex w-6 justify-center">
                    {r.rank <= 3 ? (
                      r.rank === 1 ? (
                        <Crown className={cn("size-5", MEDAL[0])} />
                      ) : (
                        <Medal className={cn("size-5", MEDAL[r.rank - 1])} />
                      )
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {r.rank}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "truncate text-sm",
                        isMe ? "font-extrabold" : "font-semibold",
                      )}
                    >
                      {r.name}
                      {isMe && (
                        <span className="ml-1 text-xs text-primary">(vos)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {r.played} jugados · {r.correctOutcomes} aciertos
                    </div>
                  </div>
                  <span className="w-10 text-center text-sm font-semibold tabular-nums">
                    {r.exactHits}
                  </span>
                  <span className="w-12 text-right">
                    <Badge variant={r.rank === 1 ? "accent" : "default"}>
                      {r.totalPoints}
                    </Badge>
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
        Se ordena por puntos totales, luego por resultados exactos y luego por
        aciertos. Se actualiza automáticamente cuando llegan los resultados.
      </p>
    </div>
  );
}
