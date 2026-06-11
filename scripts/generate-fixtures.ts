/**
 * Deterministically generates the full 104-match FIFA World Cup 2026 schedule
 * and writes it to seed/fixtures.json (committed, used by the seed script).
 *
 * IMPORTANT — data accuracy:
 * The group→team assignments and exact kickoff date/times here are a
 * representative, internally-consistent dataset, NOT the official FIFA fixture
 * list. The *structure* is correct (12 groups of 4, 72 group matches, a 32-team
 * knockout bracket that feeds forward correctly to a single final = 104). To use
 * official data, replace seed/teams.json + the schedule below (or wire the seed
 * script to football-data.org / API-Football) and re-run `npm run db:fixtures`.
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

interface FixtureTeam {
  fifaCode: string;
  groupLetter: string;
}

interface Fixture {
  matchNumber: number;
  stage: Stage;
  groupLetter: string | null;
  homeCode: string | null;
  awayCode: string | null;
  homeLabel: string | null;
  awayLabel: string | null;
  kickoffAt: string; // ISO 8601 with explicit timezone offset
  venue: string;
}

// 16 host venues with their UTC offset (summer 2026) for timezone-correct kickoffs.
const VENUES: { name: string; offset: string }[] = [
  { name: "Estadio Azteca, Mexico City", offset: "-06:00" },
  { name: "MetLife Stadium, New York/New Jersey", offset: "-04:00" },
  { name: "SoFi Stadium, Los Angeles", offset: "-07:00" },
  { name: "AT&T Stadium, Dallas", offset: "-05:00" },
  { name: "Mercedes-Benz Stadium, Atlanta", offset: "-04:00" },
  { name: "Lumen Field, Seattle", offset: "-07:00" },
  { name: "Arrowhead Stadium, Kansas City", offset: "-05:00" },
  { name: "Hard Rock Stadium, Miami", offset: "-04:00" },
  { name: "Lincoln Financial Field, Philadelphia", offset: "-04:00" },
  { name: "Levi's Stadium, San Francisco Bay Area", offset: "-07:00" },
  { name: "NRG Stadium, Houston", offset: "-05:00" },
  { name: "Gillette Stadium, Boston", offset: "-04:00" },
  { name: "BMO Field, Toronto", offset: "-04:00" },
  { name: "BC Place, Vancouver", offset: "-07:00" },
  { name: "Estadio Akron, Guadalajara", offset: "-06:00" },
  { name: "Estadio BBVA, Monterrey", offset: "-06:00" },
];

const KICKOFF_HOURS = [12, 15, 18, 21]; // local kickoff slots

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Build an ISO timestamp with explicit offset from a base date + day/slot. */
function kickoff(
  baseISODate: string,
  dayOffset: number,
  hour: number,
  tzOffset: string,
): string {
  const base = new Date(`${baseISODate}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + dayOffset);
  const y = base.getUTCFullYear();
  const m = pad(base.getUTCMonth() + 1);
  const d = pad(base.getUTCDate());
  return `${y}-${m}-${d}T${pad(hour)}:00:00${tzOffset}`;
}

function main() {
  const teams: FixtureTeam[] = JSON.parse(
    readFileSync(join(process.cwd(), "seed", "teams.json"), "utf8"),
  );

  const groups = new Map<string, string[]>();
  for (const t of teams) {
    if (!groups.has(t.groupLetter)) groups.set(t.groupLetter, []);
    groups.get(t.groupLetter)!.push(t.fifaCode);
  }
  const groupLetters = [...groups.keys()].sort();

  const fixtures: Fixture[] = [];
  let venueIdx = 0;
  const nextVenue = () => VENUES[venueIdx++ % VENUES.length].name;
  const venueOffsetFor = (name: string) =>
    VENUES.find((v) => v.name === name)!.offset;

  // --- Group stage: 72 matches -------------------------------------------
  // Standard 4-team round-robin order (1-indexed positions), grouped by matchday.
  const ROUND_ROBIN: { home: number; away: number; matchday: number }[] = [
    { home: 1, away: 2, matchday: 1 },
    { home: 3, away: 4, matchday: 1 },
    { home: 1, away: 3, matchday: 2 },
    { home: 4, away: 2, matchday: 2 },
    { home: 4, away: 1, matchday: 3 },
    { home: 2, away: 3, matchday: 3 },
  ];

  const MATCHDAY_BASE: Record<number, string> = {
    1: "2026-06-11",
    2: "2026-06-17",
    3: "2026-06-24",
  };

  // Flatten to (matchday, group, fixture) then schedule by matchday.
  type GroupFixture = {
    group: string;
    homeCode: string;
    awayCode: string;
    matchday: number;
  };
  const byMatchday: Record<number, GroupFixture[]> = { 1: [], 2: [], 3: [] };
  for (const letter of groupLetters) {
    const codes = groups.get(letter)!; // 4 codes
    for (const rr of ROUND_ROBIN) {
      byMatchday[rr.matchday].push({
        group: letter,
        homeCode: codes[rr.home - 1],
        awayCode: codes[rr.away - 1],
        matchday: rr.matchday,
      });
    }
  }

  let matchNumber = 1;
  for (const md of [1, 2, 3]) {
    const list = byMatchday[md];
    list.forEach((gf, i) => {
      const dayOffset = Math.floor(i / KICKOFF_HOURS.length);
      const hour = KICKOFF_HOURS[i % KICKOFF_HOURS.length];
      const venue = nextVenue();
      fixtures.push({
        matchNumber: matchNumber++,
        stage: "group",
        groupLetter: gf.group,
        homeCode: gf.homeCode,
        awayCode: gf.awayCode,
        homeLabel: null,
        awayLabel: null,
        kickoffAt: kickoff(
          MATCHDAY_BASE[md],
          dayOffset,
          hour,
          venueOffsetFor(venue),
        ),
        venue,
      });
    });
  }

  // --- Knockout bracket ---------------------------------------------------
  // R32 slot labels: 16 home + 16 away covering all 1x/2x group slots + 8 thirds.
  const homeSlots = [
    "1A", "1B", "1C", "1D", "1E", "1F", "1G", "1H", "1I", "1J", "1K", "1L",
    "2A", "2B", "2C", "2D",
  ];
  const awaySlots = [
    "2E", "2F", "2G", "2H", "2I", "2J", "2K", "2L",
    "3rd #1", "3rd #2", "3rd #3", "3rd #4", "3rd #5", "3rd #6", "3rd #7", "3rd #8",
  ];

  const knockoutRound = (
    stage: Stage,
    count: number,
    baseDate: string,
    slotLabel: (i: number) => { home: string; away: string },
  ) => {
    for (let i = 0; i < count; i++) {
      const dayOffset = Math.floor(i / 2);
      const hour = KICKOFF_HOURS[(i % 2) + 1]; // 15:00 / 18:00 slots
      const venue = nextVenue();
      const labels = slotLabel(i);
      fixtures.push({
        matchNumber: matchNumber++,
        stage,
        groupLetter: null,
        homeCode: null,
        awayCode: null,
        homeLabel: labels.home,
        awayLabel: labels.away,
        kickoffAt: kickoff(baseDate, dayOffset, hour, venueOffsetFor(venue)),
        venue,
      });
    }
  };

  // Turn a slot code ("1A", "2E", "3rd #4") into a human label.
  const slotLabel = (slot: string): string => {
    if (slot.startsWith("3rd")) return `Best ${slot}`;
    const pos = slot[0];
    const grp = slot.slice(1);
    return pos === "1"
      ? `Winner Group ${grp}`
      : `Runner-up Group ${grp}`;
  };

  // R32 (matches 73–88)
  knockoutRound("round_of_32", 16, "2026-06-28", (i) => ({
    home: slotLabel(homeSlots[i]),
    away: slotLabel(awaySlots[i]),
  }));

  // Helper for "winner/loser of match N".
  const W = (n: number) => `Winner of Match ${n}`;
  const L = (n: number) => `Loser of Match ${n}`;

  // R16 (89–96): pairs of consecutive R32 winners.
  knockoutRound("round_of_16", 8, "2026-07-04", (i) => ({
    home: W(73 + i * 2),
    away: W(74 + i * 2),
  }));

  // QF (97–100): pairs of consecutive R16 winners.
  knockoutRound("quarter_final", 4, "2026-07-09", (i) => ({
    home: W(89 + i * 2),
    away: W(90 + i * 2),
  }));

  // SF (101–102): pairs of consecutive QF winners.
  knockoutRound("semi_final", 2, "2026-07-14", (i) => ({
    home: W(97 + i * 2),
    away: W(98 + i * 2),
  }));

  // Third-place play-off (103): losers of the two semis.
  knockoutRound("third_place", 1, "2026-07-18", () => ({
    home: L(101),
    away: L(102),
  }));

  // Final (104): winners of the two semis.
  knockoutRound("final", 1, "2026-07-19", () => ({
    home: W(101),
    away: W(102),
  }));

  // --- Sanity checks ------------------------------------------------------
  if (fixtures.length !== 104) {
    throw new Error(`Expected 104 fixtures, got ${fixtures.length}`);
  }
  const groupCount = fixtures.filter((f) => f.stage === "group").length;
  if (groupCount !== 72) {
    throw new Error(`Expected 72 group matches, got ${groupCount}`);
  }

  const out = join(process.cwd(), "seed", "fixtures.json");
  writeFileSync(out, JSON.stringify(fixtures, null, 2) + "\n", "utf8");
  console.log(
    `[fixtures] wrote ${fixtures.length} matches → seed/fixtures.json ` +
      `(${groupCount} group + ${fixtures.length - groupCount} knockout)`,
  );
}

main();
