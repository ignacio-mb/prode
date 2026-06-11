import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getMatchDetail } from "@/lib/queries";
import { STAGE_LABELS } from "@/lib/format";
import {
  MatchDetailView,
  type MatchDetailData,
} from "@/components/match/MatchDetailView";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isInteger(matchId)) notFound();

  const user = await getCurrentUser();
  const detail = await getMatchDetail(matchId);
  if (!detail || !user) notFound();

  const data: MatchDetailData = {
    id: detail.match.id,
    stageLabel: STAGE_LABELS[detail.match.stage],
    groupLetter: detail.match.groupLetter,
    homeTeam: detail.homeTeam,
    awayTeam: detail.awayTeam,
    homeLabel: detail.match.homeLabel,
    awayLabel: detail.match.awayLabel,
    kickoffMs: detail.match.kickoffAt.getTime(),
    venue: detail.match.venue,
    status: detail.match.status,
    homeScore: detail.match.homeScore,
    awayScore: detail.match.awayScore,
    predictions: detail.predictions,
  };

  return (
    <div className="space-y-3">
      <Link
        href="/matches"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        Partidos
      </Link>
      <MatchDetailView data={data} currentUserId={user.id} />
    </div>
  );
}
