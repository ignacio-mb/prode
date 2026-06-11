import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  matches,
  predictions,
  settings,
  teams,
  users,
  type Match,
  type Settings,
  type Team,
} from "@/db/schema";

export type ScoringSettings = Settings;

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(settings).where(eq(settings.id, 1));
  if (rows[0]) return rows[0];
  // Fallback default (should always exist after seed).
  return {
    id: 1,
    exactPoints: 3,
    outcomePoints: 1,
    wrongPoints: 0,
    predictionsHiddenUntilKickoff: false,
    updatedAt: new Date(),
  };
}

export async function getAllTeams() {
  return db.query.teams.findMany({
    orderBy: [asc(teams.groupLetter), asc(teams.name)],
  });
}

export async function getPlayerCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users);
  return row?.count ?? 0;
}

export type MatchTeam = Pick<
  Team,
  "id" | "name" | "fifaCode" | "flagEmoji" | "groupLetter"
> | null;

export interface MatchListItem {
  match: Match;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  predictionCount: number;
  myPrediction: { homeGoals: number; awayGoals: number } | null;
}

/**
 * All matches (ordered by kickoff) with their teams, the count of submitted
 * predictions, and only the current user's own pick. Other players' picks are
 * NOT exposed on the matches list — they're visible on the match detail page.
 */
export async function getMatchesForUser(
  userId: number | null,
): Promise<MatchListItem[]> {
  const rows = await db.query.matches.findMany({
    with: { homeTeam: true, awayTeam: true },
    orderBy: [asc(matches.kickoffAt), asc(matches.matchNumber)],
  });

  const counts = await db
    .select({
      matchId: predictions.matchId,
      count: sql<number>`count(*)::int`,
    })
    .from(predictions)
    .groupBy(predictions.matchId);
  const countByMatch = new Map(counts.map((c) => [c.matchId, c.count]));

  let mine = new Map<number, { homeGoals: number; awayGoals: number }>();
  if (userId) {
    const myPreds = await db
      .select({
        matchId: predictions.matchId,
        homeGoals: predictions.homeGoals,
        awayGoals: predictions.awayGoals,
      })
      .from(predictions)
      .where(eq(predictions.userId, userId));
    mine = new Map(
      myPreds.map((p) => [
        p.matchId,
        { homeGoals: p.homeGoals, awayGoals: p.awayGoals },
      ]),
    );
  }

  return rows.map((m) => ({
    match: m,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    predictionCount: countByMatch.get(m.id) ?? 0,
    myPrediction: mine.get(m.id) ?? null,
  }));
}

export interface MatchDetailPrediction {
  userId: number;
  userName: string;
  homeGoals: number;
  awayGoals: number;
  points: number | null;
}

export interface MatchDetail {
  match: Match;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  predictions: MatchDetailPrediction[];
}

export async function getMatchDetail(
  matchId: number,
): Promise<MatchDetail | null> {
  const m = await db.query.matches.findFirst({
    where: eq(matches.id, matchId),
    with: { homeTeam: true, awayTeam: true },
  });
  if (!m) return null;

  const preds = await db
    .select({
      userId: predictions.userId,
      userName: users.name,
      homeGoals: predictions.homeGoals,
      awayGoals: predictions.awayGoals,
      points: predictions.points,
    })
    .from(predictions)
    .innerJoin(users, eq(users.id, predictions.userId))
    .where(eq(predictions.matchId, matchId))
    .orderBy(sql`${predictions.points} desc nulls last`, asc(users.name));

  return {
    match: m,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    predictions: preds,
  };
}

export interface LeaderboardRow {
  userId: number;
  name: string;
  totalPoints: number;
  exactHits: number;
  correctOutcomes: number;
  played: number;
  rank: number;
}

export async function getLeaderboard(): Promise<LeaderboardRow[]> {
  const result = await db.execute(sql`
    SELECT
      u.id AS "userId",
      u.name AS "name",
      COALESCE(SUM(p.points), 0)::int AS "totalPoints",
      COUNT(*) FILTER (
        WHERE m.status = 'finished'
          AND p.home_goals = m.home_score
          AND p.away_goals = m.away_score
      )::int AS "exactHits",
      COUNT(*) FILTER (
        WHERE m.status = 'finished'
          AND SIGN(p.home_goals - p.away_goals) = SIGN(m.home_score - m.away_score)
          AND NOT (p.home_goals = m.home_score AND p.away_goals = m.away_score)
      )::int AS "correctOutcomes",
      COUNT(*) FILTER (WHERE m.status = 'finished')::int AS "played"
    FROM prode.users u
    LEFT JOIN prode.predictions p ON p.user_id = u.id
    LEFT JOIN prode.matches m ON m.id = p.match_id AND m.status = 'finished'
    GROUP BY u.id, u.name
    ORDER BY "totalPoints" DESC, "exactHits" DESC, "correctOutcomes" DESC, u.name ASC
  `);

  const rows = result as unknown as Array<{
    userId: number;
    name: string;
    totalPoints: number;
    exactHits: number;
    correctOutcomes: number;
    played: number;
  }>;

  // Dense ranking with ties sharing a rank.
  let lastKey = "";
  let lastRank = 0;
  return rows.map((r, i) => {
    const key = `${r.totalPoints}-${r.exactHits}-${r.correctOutcomes}`;
    const rank = key === lastKey ? lastRank : i + 1;
    lastKey = key;
    lastRank = rank;
    return { ...r, rank };
  });
}

export interface MyPredictionRow {
  match: Match;
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  homeGoals: number;
  awayGoals: number;
  points: number | null;
}

export async function getMyPredictions(
  userId: number,
): Promise<MyPredictionRow[]> {
  const rows = await db
    .select({
      prediction: predictions,
      match: matches,
    })
    .from(predictions)
    .innerJoin(matches, eq(matches.id, predictions.matchId))
    .where(eq(predictions.userId, userId))
    .orderBy(asc(matches.kickoffAt));

  if (rows.length === 0) return [];

  // Fetch teams referenced.
  const teamIds = new Set<number>();
  for (const r of rows) {
    if (r.match.homeTeamId) teamIds.add(r.match.homeTeamId);
    if (r.match.awayTeamId) teamIds.add(r.match.awayTeamId);
  }
  const teamList = await db.query.teams.findMany();
  const teamById = new Map(teamList.map((t) => [t.id, t]));

  return rows.map((r) => ({
    match: r.match,
    homeTeam: r.match.homeTeamId
      ? teamById.get(r.match.homeTeamId) ?? null
      : null,
    awayTeam: r.match.awayTeamId
      ? teamById.get(r.match.awayTeamId) ?? null
      : null,
    homeGoals: r.prediction.homeGoals,
    awayGoals: r.prediction.awayGoals,
    points: r.prediction.points,
  }));
}
