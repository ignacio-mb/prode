import type { MatchStatus, Stage } from "@/db/schema";
import type { MatchListItem, MatchPrediction } from "@/lib/queries";
import { STAGE_LABELS } from "@/lib/format";

export interface ClientTeam {
  id: number;
  name: string;
  fifaCode: string;
  flagEmoji: string;
  groupLetter: string | null;
}

export interface ClientMatch {
  id: number;
  matchNumber: number;
  stage: Stage;
  stageLabel: string;
  groupLetter: string | null;
  homeTeam: ClientTeam | null;
  awayTeam: ClientTeam | null;
  homeLabel: string | null;
  awayLabel: string | null;
  kickoffMs: number;
  venue: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  predictionCount: number;
  myPrediction: { homeGoals: number; awayGoals: number } | null;
  predictions: MatchPrediction[];
}

/** Map a server MatchListItem to a serializable shape for client components. */
export function toClientMatch(item: MatchListItem): ClientMatch {
  const m = item.match;
  return {
    id: m.id,
    matchNumber: m.matchNumber,
    stage: m.stage,
    stageLabel: STAGE_LABELS[m.stage],
    groupLetter: m.groupLetter,
    homeTeam: item.homeTeam,
    awayTeam: item.awayTeam,
    homeLabel: m.homeLabel,
    awayLabel: m.awayLabel,
    kickoffMs: m.kickoffAt.getTime(),
    venue: m.venue,
    status: m.status,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    predictionCount: item.predictionCount,
    myPrediction: item.myPrediction,
    predictions: item.predictions,
  };
}
