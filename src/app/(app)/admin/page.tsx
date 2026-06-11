import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import {
  getAllTeams,
  getMatchesForUser,
  getSettings,
} from "@/lib/queries";
import { toClientMatch } from "@/components/match/types";
import { AdminScoringForm } from "@/components/admin/AdminScoringForm";
import {
  AdminMatches,
  type AdminTeamOption,
} from "@/components/admin/AdminMatches";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  if (!user.isAdmin) redirect("/matches");

  const [items, teams, settings] = await Promise.all([
    getMatchesForUser(null),
    getAllTeams(),
    getSettings(),
  ]);

  const matches = items.map(toClientMatch);
  const teamOptions: AdminTeamOption[] = teams.map((t) => ({
    id: t.id,
    name: t.name,
    flagEmoji: t.flagEmoji,
    groupLetter: t.groupLetter,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="size-6 text-primary" />
        <h1 className="text-2xl font-extrabold tracking-tight">Admin</h1>
      </div>

      <AdminScoringForm
        initial={{
          exactPoints: settings.exactPoints,
          outcomePoints: settings.outcomePoints,
          wrongPoints: settings.wrongPoints,
        }}
      />

      <div>
        <h2 className="mb-2 text-sm font-bold">Resultados y fixture</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Cargá los resultados finales para otorgar puntos. En los partidos de
          eliminación, asigná los equipos cuando se defina el cuadro.
        </p>
        <AdminMatches matches={matches} teams={teamOptions} />
      </div>
    </div>
  );
}
