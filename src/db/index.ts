import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getConnectionString, getPostgresOptions } from "./connection";

const connectionString = getConnectionString();

// Reuse a single client across hot-reloads in dev to avoid exhausting
// connections.
const globalForDb = globalThis as unknown as {
  __prodeClient?: ReturnType<typeof postgres>;
};

// Keep the pool small: Supabase's free Session pooler caps total connections
// (≈15), and a zero-downtime deploy can briefly run two instances at once.
const POOL_MAX = Number(process.env.DB_POOL_MAX ?? 6);

const client =
  globalForDb.__prodeClient ??
  postgres(connectionString, getPostgresOptions(POOL_MAX));

if (process.env.NODE_ENV !== "production") {
  globalForDb.__prodeClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
export type Db = typeof db;
