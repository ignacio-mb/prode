import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { getPostgresOptions } from "./connection";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  // A dedicated single-connection client for migrations (Supabase pooler /
  // SSL handled by the shared options helper).
  const client = postgres(connectionString, getPostgresOptions(1));

  const db = drizzle(client);

  console.log("[migrate] running migrations…");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] done.");

  await client.end();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
