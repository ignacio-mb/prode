import {
  boolean,
  index,
  integer,
  pgSchema,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// All app tables live in a dedicated "prode" schema so the app never collides
// with anything in `public` (handy when sharing a Supabase project).
export const prode = pgSchema("prode");

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const stageEnum = prode.enum("stage", [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter_final",
  "semi_final",
  "third_place",
  "final",
]);

export const matchStatusEnum = prode.enum("match_status", [
  "scheduled",
  "live",
  "finished",
]);

// ---------------------------------------------------------------------------
// users
// Lightweight, passwordless auth: a user is just a unique display name.
// (PIN intentionally omitted — see README "Auth" section / pin_hash kept
// nullable so a PIN can be layered on later without a migration.)
// ---------------------------------------------------------------------------

export const users = prode.table("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  pinHash: text("pin_hash"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// teams
// 48 nations. flagEmoji is the country flag; group_letter A–L (12 groups).
// ---------------------------------------------------------------------------

export const teams = prode.table("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  fifaCode: text("fifa_code").notNull().unique(), // e.g. "ARG"
  flagEmoji: text("flag_emoji").notNull(),
  groupLetter: text("group_letter"), // null for placeholder/none
});

// ---------------------------------------------------------------------------
// matches
// Knockout matches start with null team ids; home_label / away_label describe
// the slot ("Winner Group A", "3rd A/B/C/D", "Winner M73"...) until the bracket
// resolves and an admin assigns the real teams.
// ---------------------------------------------------------------------------

export const matches = prode.table(
  "matches",
  {
    id: serial("id").primaryKey(),
    // Stable human/external match number (1..104) for ordering + bracket refs.
    matchNumber: integer("match_number").notNull().unique(),
    stage: stageEnum("stage").notNull(),
    groupLetter: text("group_letter"), // only for group stage
    homeTeamId: integer("home_team_id").references(() => teams.id),
    awayTeamId: integer("away_team_id").references(() => teams.id),
    homeLabel: text("home_label"), // shown when team is not yet known
    awayLabel: text("away_label"),
    kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
    venue: text("venue").notNull(),
    status: matchStatusEnum("status").notNull().default("scheduled"),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
  },
  (t) => ({
    kickoffIdx: index("matches_kickoff_idx").on(t.kickoffAt),
    stageIdx: index("matches_stage_idx").on(t.stage),
  }),
);

// ---------------------------------------------------------------------------
// predictions
// One row per (user, match). points is null until the match is finalized.
// ---------------------------------------------------------------------------

export const predictions = prode.table(
  "predictions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    homeGoals: integer("home_goals").notNull(),
    awayGoals: integer("away_goals").notNull(),
    points: integer("points"), // null = not yet scored
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    userMatchUnique: unique("predictions_user_match_unique").on(
      t.userId,
      t.matchId,
    ),
    matchIdx: index("predictions_match_idx").on(t.matchId),
    userIdx: index("predictions_user_idx").on(t.userId),
  }),
);

// ---------------------------------------------------------------------------
// settings
// Single-row key/value-ish config table for scoring. One row, id = 1.
// ---------------------------------------------------------------------------

export const settings = prode.table("settings", {
  id: integer("id").primaryKey().default(1),
  exactPoints: integer("exact_points").notNull().default(3),
  outcomePoints: integer("outcome_points").notNull().default(1),
  wrongPoints: integer("wrong_points").notNull().default(0),
  // Predictions are fully open (visible to everyone) per the group's choice.
  // Kept as a flag so the group can switch to "hidden until kickoff" later.
  predictionsHiddenUntilKickoff: boolean("predictions_hidden_until_kickoff")
    .notNull()
    .default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Relations (for typed query helpers)
// ---------------------------------------------------------------------------

export const usersRelations = relations(users, ({ many }) => ({
  predictions: many(predictions),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  homeMatches: many(matches, { relationName: "homeTeam" }),
  awayMatches: many(matches, { relationName: "awayTeam" }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: "homeTeam",
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: "awayTeam",
  }),
  predictions: many(predictions),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  user: one(users, {
    fields: [predictions.userId],
    references: [users.id],
  }),
  match: one(matches, {
    fields: [predictions.matchId],
    references: [matches.id],
  }),
}));

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type User = typeof users.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type Prediction = typeof predictions.$inferSelect;
export type Settings = typeof settings.$inferSelect;
export type Stage = (typeof stageEnum.enumValues)[number];
export type MatchStatus = (typeof matchStatusEnum.enumValues)[number];
