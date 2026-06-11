import "server-only";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import { computePoints } from "@/lib/scoring";
import { getSettings } from "@/lib/queries";

/**
 * Recompute points for every prediction on a single match. If the match isn't
 * finished (or has no score), all its predictions are reset to null points.
 */
export async function recomputeMatch(matchId: number): Promise<void> {
  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });
  if (!match) return;

  const finished =
    match.status === "finished" &&
    match.homeScore !== null &&
    match.awayScore !== null;

  if (!finished) {
    await db
      .update(predictions)
      .set({ points: null })
      .where(eq(predictions.matchId, matchId));
    return;
  }

  const scoring = await getSettings();
  const preds = await db
    .select()
    .from(predictions)
    .where(eq(predictions.matchId, matchId));

  for (const p of preds) {
    const points = computePoints(
      p.homeGoals,
      p.awayGoals,
      match.homeScore!,
      match.awayScore!,
      scoring,
    );
    if (points !== p.points) {
      await db
        .update(predictions)
        .set({ points })
        .where(eq(predictions.id, p.id));
    }
  }
}

/** Recompute every finished match (used after a scoring-config change). */
export async function recomputeAllFinished(): Promise<void> {
  const finished = await db
    .select({ id: matches.id })
    .from(matches)
    .where(isNotNull(matches.homeScore));
  for (const m of finished) {
    await recomputeMatch(m.id);
  }
}
