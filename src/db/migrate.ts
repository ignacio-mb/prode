import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }

  const sslMode = process.env.DATABASE_SSL as
    | "require"
    | "prefer"
    | "allow"
    | undefined;

  // A dedicated single-connection client for migrations.
  const client = postgres(connectionString, {
    max: 1,
    ...(sslMode ? { ssl: sslMode } : {}),
  });

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
