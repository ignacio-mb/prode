import { z } from "zod";

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(24, "Name must be at most 24 characters")
  .regex(
    /^[\p{L}\p{N} ._'-]+$/u,
    "Use letters, numbers, spaces, and . _ ' - only",
  );

export const goalsSchema = z
  .number()
  .int("Goals must be a whole number")
  .min(0, "Goals can't be negative")
  .max(30, "That's a lot of goals");

export const predictionInputSchema = z.object({
  matchId: z.number().int().positive(),
  homeGoals: goalsSchema,
  awayGoals: goalsSchema,
});

export const resultInputSchema = z.object({
  matchId: z.number().int().positive(),
  homeScore: goalsSchema,
  awayScore: goalsSchema,
});

export const scoringSettingsSchema = z.object({
  exactPoints: z.number().int().min(0).max(100),
  outcomePoints: z.number().int().min(0).max(100),
  wrongPoints: z.number().int().min(0).max(100),
});

export type PredictionInput = z.infer<typeof predictionInputSchema>;
export type ResultInput = z.infer<typeof resultInputSchema>;
export type ScoringSettingsInput = z.infer<typeof scoringSettingsSchema>;
