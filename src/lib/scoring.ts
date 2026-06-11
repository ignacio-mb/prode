import type { Settings } from "@/db/schema";

export type Outcome = "home" | "draw" | "away";

export function outcomeOf(homeGoals: number, awayGoals: number): Outcome {
  if (homeGoals > awayGoals) return "home";
  if (homeGoals < awayGoals) return "away";
  return "draw";
}

export type ScoreKind = "exact" | "outcome" | "wrong";

export function scoreKind(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
): ScoreKind {
  if (predHome === actualHome && predAway === actualAway) return "exact";
  if (outcomeOf(predHome, predAway) === outcomeOf(actualHome, actualAway)) {
    return "outcome";
  }
  return "wrong";
}

export const DEFAULT_SCORING = {
  exactPoints: 3,
  outcomePoints: 1,
  wrongPoints: 0,
} as const;

/**
 * Points for a single prediction against a finalized result.
 */
export function computePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number,
  scoring: Pick<
    Settings,
    "exactPoints" | "outcomePoints" | "wrongPoints"
  > = DEFAULT_SCORING,
): number {
  switch (scoreKind(predHome, predAway, actualHome, actualAway)) {
    case "exact":
      return scoring.exactPoints;
    case "outcome":
      return scoring.outcomePoints;
    case "wrong":
      return scoring.wrongPoints;
  }
}
