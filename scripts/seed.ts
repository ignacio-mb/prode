/**
 * Idempotent seed: teams, the full 104-match schedule, and the default scoring
 * settings row. Safe to run repeatedly (on every deploy / container boot).
 *
 *   npm run db:seed          # upsert everything, preserve existing results
 *   npm run db:seed -- --reset   # wipe predictions/matches/teams first
 *
 * Re-seeding NEVER overwrites entered match scores/status or the settings row,
 * so a redeploy won't clobber an in-progress tournament.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { join } from "path";
import { sql } from "drizzle-orm";
import { db } from "../src/db";
import { teams, matches, settings, predictions } from "../src/db/schema";

type Stage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

interface TeamSeed {
  name: string;
  fifaCode: string;
  flagEmoji: string;
  groupLetter: string;
}

interface FixtureSeed {
  matchNumber: number;
  stage: Stage;
  groupLetter: string | null;
  homeCode: string | null;
  awayCode: string | null;
  homeLabel: string | null;
  awayLabel: string | null;
  kickoffAt: string;
  venue: string;
}

function read<T>(file: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), "seed", file), "utf8"));
}

async function main() {
  const reset = process.argv.includes("--reset");

  const teamSeed = read<TeamSeed[]>("teams.json");
  const fixtureSeed = read<FixtureSeed[]>("fixtures.json");

  if (reset) {
    console.log("[seed] --reset: clearing predictions, matches, teams…");
    await db.delete(predictions);
    await db.delete(matches);
    await db.delete(teams);
  }

  // 1) Default scoring settings (only if not present — never clobber edits).
  await db
    .insert(settings)
    .values({ id: 1 })
    .onConflictDoNothing({ target: settings.id });

  // 2) Teams — upsert by fifaCode.
  for (const t of teamSeed) {
    await db
      .insert(teams)
      .values({
        name: t.name,
        fifaCode: t.fifaCode,
        flagEmoji: t.flagEmoji,
        groupLetter: t.groupLetter,
      })
      .onConflictDoUpdate({
        target: teams.fifaCode,
        set: {
          name: t.name,
          flagEmoji: t.flagEmoji,
          groupLetter: t.groupLetter,
        },
      });
  }

  // Build fifaCode -> id map.
  const allTeams = await db.select().from(teams);
  const idByCode = new Map(allTeams.map((t) => [t.fifaCode, t.id]));

  // 3) Matches — upsert by matchNumber. Preserve scores/status on existing rows.
  for (const f of fixtureSeed) {
    const homeTeamId = f.homeCode ? idByCode.get(f.homeCode) ?? null : null;
    const awayTeamId = f.awayCode ? idByCode.get(f.awayCode) ?? null : null;

    await db
      .insert(matches)
      .values({
        matchNumber: f.matchNumber,
        stage: f.stage,
        groupLetter: f.groupLetter,
        homeTeamId,
        awayTeamId,
        homeLabel: f.homeLabel,
        awayLabel: f.awayLabel,
        kickoffAt: new Date(f.kickoffAt),
        venue: f.venue,
      })
      .onConflictDoUpdate({
        target: matches.matchNumber,
        // Only schedule/identity fields — NOT homeScore/awayScore/status.
        set: {
          stage: f.stage,
          groupLetter: f.groupLetter,
          homeTeamId,
          awayTeamId,
          homeLabel: f.homeLabel,
          awayLabel: f.awayLabel,
          kickoffAt: new Date(f.kickoffAt),
          venue: f.venue,
        },
      });
  }

  const [{ count: teamCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(teams);
  const [{ count: matchCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matches);

  console.log(
    `[seed] done — ${teamCount} teams, ${matchCount} matches, settings ready.`,
  );

  // Close the pooled connection so the process exits.
  await db.$client.end();
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
