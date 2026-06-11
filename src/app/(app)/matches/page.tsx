import { getCurrentUser } from "@/lib/auth";
import { getMatchesForUser, getPlayerCount } from "@/lib/queries";
import { MatchList } from "@/components/match/MatchList";
import { toClientMatch } from "@/components/match/types";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const user = await getCurrentUser();
  const [items, playerCount] = await Promise.all([
    getMatchesForUser(user?.id ?? null),
    getPlayerCount(),
  ]);
  const matches = items.map(toClientMatch);

  const open = matches.filter(
    (m) => m.status !== "finished" && m.myPrediction === null,
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Partidos</h1>
        {open > 0 && (
          <span className="text-xs font-semibold text-primary">
            {open} para pronosticar
          </span>
        )}
      </div>
      <MatchList matches={matches} playerCount={playerCount} />
    </div>
  );
}
