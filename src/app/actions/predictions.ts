"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, predictions } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { predictionInputSchema } from "@/lib/validation";

export type SaveResult =
  | { ok: true; homeGoals: number; awayGoals: number }
  | { ok: false; error: string };

export async function savePredictionAction(input: {
  matchId: number;
  homeGoals: number;
  awayGoals: number;
}): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Please sign in again." };

  const parsed = predictionInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid prediction",
    };
  }
  const { matchId, homeGoals, awayGoals } = parsed.data;

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });
  if (!match) return { ok: false, error: "Match not found." };

  // Lock check — predictions editable only until kickoff.
  if (Date.now() >= match.kickoffAt.getTime()) {
    return { ok: false, error: "This match is locked." };
  }

  await db
    .insert(predictions)
    .values({ userId: user.id, matchId, homeGoals, awayGoals })
    .onConflictDoUpdate({
      target: [predictions.userId, predictions.matchId],
      set: { homeGoals, awayGoals, updatedAt: new Date() },
    });

  revalidatePath("/matches");
  revalidatePath(`/matches/${matchId}`);
  revalidatePath("/my-predictions");
  return { ok: true, homeGoals, awayGoals };
}
