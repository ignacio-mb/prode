/**
 * Transforms the official-aligned FIFA World Cup 2026 schedule (sourced from the
 * public-domain openfootball dataset, committed at seed/worldcup.2026.json) into
 * the two seed files the app loads:
 *   - seed/teams.json     (48 teams, with FIFA codes + flag emojis + group)
 *   - seed/fixtures.json  (104 matches, FIFA match numbers 1–104)
 *
 * Source: https://github.com/openfootball/worldcup.json (2026/worldcup.json)
 * Kickoff times are stored as absolute instants (date + local time + venue UTC
 * offset), so the app renders them in each viewer's timezone (e.g. Argentina).
 *
 * Run: npm run db:fixtures
 */
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

type Stage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

interface SourceMatch {
  round: string;
  date: string;
  time: string; // "13:00 UTC-6"
  team1: string;
  team2: string;
  group?: string; // "Group A"
  ground: string;
}

interface Fixture {
  matchNumber: number;
  stage: Stage;
  groupLetter: string | null;
  homeCode: string | null;
  awayCode: string | null;
  homeLabel: string | null;
  awayLabel: string | null;
  kickoffAt: string; // ISO 8601 with explicit offset
  venue: string;
}

// name (as it appears in the source) -> FIFA code + flag emoji
const TEAM_META: Record<string, { fifaCode: string; flagEmoji: string }> = {
  Mexico: { fifaCode: "MEX", flagEmoji: "🇲🇽" },
  "South Africa": { fifaCode: "RSA", flagEmoji: "🇿🇦" },
  "South Korea": { fifaCode: "KOR", flagEmoji: "🇰🇷" },
  "Czech Republic": { fifaCode: "CZE", flagEmoji: "🇨🇿" },
  Canada: { fifaCode: "CAN", flagEmoji: "🇨🇦" },
  "Bosnia & Herzegovina": { fifaCode: "BIH", flagEmoji: "🇧🇦" },
  Qatar: { fifaCode: "QAT", flagEmoji: "🇶🇦" },
  Switzerland: { fifaCode: "SUI", flagEmoji: "🇨🇭" },
  Brazil: { fifaCode: "BRA", flagEmoji: "🇧🇷" },
  Morocco: { fifaCode: "MAR", flagEmoji: "🇲🇦" },
  Haiti: { fifaCode: "HAI", flagEmoji: "🇭🇹" },
  Scotland: { fifaCode: "SCO", flagEmoji: "🏴󠁧󠁢󠁳󠁣󠁴󠁿" },
  USA: { fifaCode: "USA", flagEmoji: "🇺🇸" },
  Paraguay: { fifaCode: "PAR", flagEmoji: "🇵🇾" },
  Australia: { fifaCode: "AUS", flagEmoji: "🇦🇺" },
  Turkey: { fifaCode: "TUR", flagEmoji: "🇹🇷" },
  Germany: { fifaCode: "GER", flagEmoji: "🇩🇪" },
  "Curaçao": { fifaCode: "CUW", flagEmoji: "🇨🇼" },
  "Ivory Coast": { fifaCode: "CIV", flagEmoji: "🇨🇮" },
  Ecuador: { fifaCode: "ECU", flagEmoji: "🇪🇨" },
  Netherlands: { fifaCode: "NED", flagEmoji: "🇳🇱" },
  Japan: { fifaCode: "JPN", flagEmoji: "🇯🇵" },
  Sweden: { fifaCode: "SWE", flagEmoji: "🇸🇪" },
  Tunisia: { fifaCode: "TUN", flagEmoji: "🇹🇳" },
  Belgium: { fifaCode: "BEL", flagEmoji: "🇧🇪" },
  Egypt: { fifaCode: "EGY", flagEmoji: "🇪🇬" },
  Iran: { fifaCode: "IRN", flagEmoji: "🇮🇷" },
  "New Zealand": { fifaCode: "NZL", flagEmoji: "🇳🇿" },
  Spain: { fifaCode: "ESP", flagEmoji: "🇪🇸" },
  "Cape Verde": { fifaCode: "CPV", flagEmoji: "🇨🇻" },
  "Saudi Arabia": { fifaCode: "KSA", flagEmoji: "🇸🇦" },
  Uruguay: { fifaCode: "URU", flagEmoji: "🇺🇾" },
  France: { fifaCode: "FRA", flagEmoji: "🇫🇷" },
  Senegal: { fifaCode: "SEN", flagEmoji: "🇸🇳" },
  Iraq: { fifaCode: "IRQ", flagEmoji: "🇮🇶" },
  Norway: { fifaCode: "NOR", flagEmoji: "🇳🇴" },
  Argentina: { fifaCode: "ARG", flagEmoji: "🇦🇷" },
  Algeria: { fifaCode: "ALG", flagEmoji: "🇩🇿" },
  Austria: { fifaCode: "AUT", flagEmoji: "🇦🇹" },
  Jordan: { fifaCode: "JOR", flagEmoji: "🇯🇴" },
  Portugal: { fifaCode: "POR", flagEmoji: "🇵🇹" },
  "DR Congo": { fifaCode: "COD", flagEmoji: "🇨🇩" },
  Uzbekistan: { fifaCode: "UZB", flagEmoji: "🇺🇿" },
  Colombia: { fifaCode: "COL", flagEmoji: "🇨🇴" },
  England: { fifaCode: "ENG", flagEmoji: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  Croatia: { fifaCode: "CRO", flagEmoji: "🇭🇷" },
  Ghana: { fifaCode: "GHA", flagEmoji: "🇬🇭" },
  Panama: { fifaCode: "PAN", flagEmoji: "🇵🇦" },
};

const STAGE_BY_ROUND = (round: string): Stage => {
  if (round.startsWith("Matchday")) return "group";
  if (round === "Round of 32") return "round_of_32";
  if (round === "Round of 16") return "round_of_16";
  if (round === "Quarter-final") return "quarter_final";
  if (round === "Semi-final") return "semi_final";
  if (round === "Match for third place") return "third_place";
  if (round === "Final") return "final";
  throw new Error(`Unknown round: ${round}`);
};

/** Convert "13:00 UTC-6" + date -> ISO with explicit offset. */
function toIso(date: string, time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})\s+UTC([+-]\d{1,2})$/);
  if (!match) throw new Error(`Unparseable time: "${time}"`);
  const [, hh, mm, off] = match;
  const sign = off.startsWith("-") ? "-" : "+";
  const offHours = Math.abs(parseInt(off, 10));
  const offset = `${sign}${String(offHours).padStart(2, "0")}:00`;
  return `${date}T${hh.padStart(2, "0")}:${mm}:00${offset}`;
}

/** Knockout placeholder ("1A", "2B", "3A/B/C/D/F", "W74", "L101") -> ES label. */
function knockoutLabel(slot: string): string {
  let m;
  if ((m = slot.match(/^1([A-L])$/))) return `Ganador Grupo ${m[1]}`;
  if ((m = slot.match(/^2([A-L])$/))) return `2º Grupo ${m[1]}`;
  if ((m = slot.match(/^3([A-Z/]+)$/))) return `3º (${m[1]})`;
  if ((m = slot.match(/^W(\d+)$/))) return `Ganador del Partido ${m[1]}`;
  if ((m = slot.match(/^L(\d+)$/))) return `Perdedor del Partido ${m[1]}`;
  return slot;
}

function main() {
  const source: { matches: SourceMatch[] } = JSON.parse(
    readFileSync(join(process.cwd(), "seed", "worldcup.2026.json"), "utf8"),
  );
  const matches = source.matches;
  if (matches.length !== 104) {
    throw new Error(`Expected 104 source matches, got ${matches.length}`);
  }

  // --- Teams (from group-stage matches) ---------------------------------
  const teamsByName = new Map<
    string,
    { name: string; fifaCode: string; flagEmoji: string; groupLetter: string }
  >();
  for (const m of matches) {
    if (!m.group) continue;
    const letter = m.group.replace("Group ", "");
    for (const name of [m.team1, m.team2]) {
      if (teamsByName.has(name)) continue;
      const meta = TEAM_META[name];
      if (!meta) throw new Error(`No FIFA code/flag mapping for team: ${name}`);
      teamsByName.set(name, {
        name,
        fifaCode: meta.fifaCode,
        flagEmoji: meta.flagEmoji,
        groupLetter: letter,
      });
    }
  }
  if (teamsByName.size !== 48) {
    throw new Error(`Expected 48 teams, got ${teamsByName.size}`);
  }
  const teams = [...teamsByName.values()].sort(
    (a, b) =>
      a.groupLetter.localeCompare(b.groupLetter) || a.name.localeCompare(b.name),
  );

  // --- Fixtures (FIFA match number = position in the official order) -----
  const fixtures: Fixture[] = matches.map((m, i) => {
    const stage = STAGE_BY_ROUND(m.round);
    const isGroup = stage === "group";
    const code = (name: string) => TEAM_META[name]?.fifaCode ?? null;
    return {
      matchNumber: i + 1,
      stage,
      groupLetter: isGroup && m.group ? m.group.replace("Group ", "") : null,
      homeCode: isGroup ? code(m.team1) : null,
      awayCode: isGroup ? code(m.team2) : null,
      homeLabel: isGroup ? null : knockoutLabel(m.team1),
      awayLabel: isGroup ? null : knockoutLabel(m.team2),
      kickoffAt: toIso(m.date, m.time),
      venue: m.ground,
    };
  });

  // --- Sanity checks -----------------------------------------------------
  const groupCount = fixtures.filter((f) => f.stage === "group").length;
  if (groupCount !== 72) throw new Error(`Expected 72 group matches, got ${groupCount}`);

  writeFileSync(
    join(process.cwd(), "seed", "teams.json"),
    JSON.stringify(teams, null, 2) + "\n",
    "utf8",
  );
  writeFileSync(
    join(process.cwd(), "seed", "fixtures.json"),
    JSON.stringify(fixtures, null, 2) + "\n",
    "utf8",
  );
  console.log(
    `[fixtures] wrote ${teams.length} teams + ${fixtures.length} matches ` +
      `(${groupCount} group + ${fixtures.length - groupCount} knockout) from official schedule.`,
  );
}

main();
