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

const client =
  globalForDb.__prodeClient ?? postgres(connectionString, getPostgresOptions(10));

if (process.env.NODE_ENV !== "production") {
  globalForDb.__prodeClient = client;
}

export const db = drizzle(client, { schema });
export { schema };
export type Db = typeof db;
