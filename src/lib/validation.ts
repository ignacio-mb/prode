import { z } from "zod";

export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(24, "El nombre debe tener como máximo 24 caracteres")
  .regex(
    /^[\p{L}\p{N} ._'-]+$/u,
    "Usá solo letras, números, espacios y . _ ' -",
  );

export const goalsSchema = z
  .number()
  .int("Los goles deben ser un número entero")
  .min(0, "Los goles no pueden ser negativos")
  .max(30, "Demasiados goles");

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
