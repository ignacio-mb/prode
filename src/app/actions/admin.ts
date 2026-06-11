"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { matches, settings } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { recomputeAllFinished, recomputeMatch } from "@/lib/recompute";
import { resultInputSchema, scoringSettingsSchema } from "@/lib/validation";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function ensureAdmin(): Promise<ActionResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return { ok: false, error: "Admin only." };
  }
}

function revalidateAll() {
  revalidatePath("/matches");
  revalidatePath("/leaderboard");
  revalidatePath("/my-predictions");
  revalidatePath("/admin");
}

/** Enter / edit a final score and recompute points for the match. */
export async function saveResultAction(input: {
  matchId: number;
  homeScore: number;
  awayScore: number;
}): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const parsed = resultInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }
  const { matchId, homeScore, awayScore } = parsed.data;

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
  });
  if (!match) return { ok: false, error: "Match not found." };

  await db
    .update(matches)
    .set({ homeScore, awayScore, status: "finished" })
    .where(eq(matches.id, matchId));

  await recomputeMatch(matchId);
  revalidateAll();
  revalidatePath(`/matches/${matchId}`);
  return { ok: true };
}

/** Clear a result (back to scheduled) and null out its points. */
export async function clearResultAction(input: {
  matchId: number;
}): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  await db
    .update(matches)
    .set({ homeScore: null, awayScore: null, status: "scheduled" })
    .where(eq(matches.id, input.matchId));

  await recomputeMatch(input.matchId);
  revalidateAll();
  revalidatePath(`/matches/${input.matchId}`);
  return { ok: true };
}

/** Toggle a match between scheduled and live (cosmetic status). */
export async function setLiveAction(input: {
  matchId: number;
  live: boolean;
}): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const match = await db.query.matches.findFirst({
    where: eq(matches.id, input.matchId),
  });
  if (!match) return { ok: false, error: "Match not found." };
  if (match.status === "finished") {
    return { ok: false, error: "Match already finished." };
  }

  await db
    .update(matches)
    .set({ status: input.live ? "live" : "scheduled" })
    .where(eq(matches.id, input.matchId));
  revalidateAll();
  return { ok: true };
}

/** Assign real teams to a knockout match once the bracket resolves. */
export async function assignTeamsAction(input: {
  matchId: number;
  homeTeamId: number | null;
  awayTeamId: number | null;
}): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  await db
    .update(matches)
    .set({
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
    })
    .where(eq(matches.id, input.matchId));
  revalidateAll();
  return { ok: true };
}

/** Update scoring config and recompute every finished match. */
export async function updateScoringAction(input: {
  exactPoints: number;
  outcomePoints: number;
  wrongPoints: number;
}): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const parsed = scoringSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
  }

  await db
    .update(settings)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(settings.id, 1));

  await recomputeAllFinished();
  revalidateAll();
  return { ok: true };
}
