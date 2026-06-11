import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Note: we do NOT throw here when DATABASE_URL is missing. `next build` imports
// this module while collecting page data, and the Docker build stage has no env.
// All data pages are dynamic (no queries at build), and postgres.js connects
// lazily — so a missing URL only fails at actual query time, at runtime, where
// the URL is always present (compose/Render inject it).
const connectionString =
  process.env.DATABASE_URL ??
  "postgres://placeholder:placeholder@localhost:5432/placeholder";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[db] DATABASE_URL is not set — using a placeholder. This is expected " +
      "during `next build`; ensure it is set at runtime.",
  );
}

// SSL handling:
// - Local docker Postgres + Render *internal* connections: no SSL (default).
// - External managed Postgres (Neon/Supabase): set DATABASE_SSL=require.
const sslMode = process.env.DATABASE_SSL as
  | "require"
  | "prefer"
  | "allow"
  | undefined;

// Reuse a single client across hot-reloads in dev to avoid exhausting
// connections.
const globalForDb = globalThis as unknown as {
  __prodeClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.__prodeClient ??
  postgres(connectionString, {
    max: 10,
    ...(sslMode ? { ssl: sslMode } : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__prodeClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
export type Db = typeof db;
