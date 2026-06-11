CREATE SCHEMA "prode";
--> statement-breakpoint
CREATE TYPE "prode"."match_status" AS ENUM('scheduled', 'live', 'finished');--> statement-breakpoint
CREATE TYPE "prode"."stage" AS ENUM('group', 'round_of_32', 'round_of_16', 'quarter_final', 'semi_final', 'third_place', 'final');--> statement-breakpoint
CREATE TABLE "prode"."matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_number" integer NOT NULL,
	"stage" "prode"."stage" NOT NULL,
	"group_letter" text,
	"home_team_id" integer,
	"away_team_id" integer,
	"home_label" text,
	"away_label" text,
	"kickoff_at" timestamp with time zone NOT NULL,
	"venue" text NOT NULL,
	"status" "prode"."match_status" DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	CONSTRAINT "matches_match_number_unique" UNIQUE("match_number")
);
--> statement-breakpoint
CREATE TABLE "prode"."predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"match_id" integer NOT NULL,
	"home_goals" integer NOT NULL,
	"away_goals" integer NOT NULL,
	"points" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "predictions_user_match_unique" UNIQUE("user_id","match_id")
);
--> statement-breakpoint
CREATE TABLE "prode"."settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"exact_points" integer DEFAULT 3 NOT NULL,
	"outcome_points" integer DEFAULT 1 NOT NULL,
	"wrong_points" integer DEFAULT 0 NOT NULL,
	"predictions_hidden_until_kickoff" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prode"."teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"fifa_code" text NOT NULL,
	"flag_emoji" text NOT NULL,
	"group_letter" text,
	CONSTRAINT "teams_name_unique" UNIQUE("name"),
	CONSTRAINT "teams_fifa_code_unique" UNIQUE("fifa_code")
);
--> statement-breakpoint
CREATE TABLE "prode"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"pin_hash" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "prode"."matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "prode"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prode"."matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "prode"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prode"."predictions" ADD CONSTRAINT "predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "prode"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prode"."predictions" ADD CONSTRAINT "predictions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "prode"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "matches_kickoff_idx" ON "prode"."matches" USING btree ("kickoff_at");--> statement-breakpoint
CREATE INDEX "matches_stage_idx" ON "prode"."matches" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "predictions_match_idx" ON "prode"."predictions" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "predictions_user_idx" ON "prode"."predictions" USING btree ("user_id");