/**
 * Resolve the Postgres connection string. We don't throw when it's missing:
 * `next build` imports the db module while collecting page data and the Docker
 * build stage has no env. All data pages are dynamic (no queries at build) and
 * postgres.js connects lazily, so a missing URL only fails at real query time —
 * at runtime, where the URL is always present.
 */
export function getConnectionString(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      "[db] DATABASE_URL is not set — using a placeholder. Expected during " +
        "`next build`; ensure it is set at runtime.",
    );
  }
  return "postgres://placeholder:placeholder@localhost:5432/placeholder";
}

/**
 * postgres.js options, with managed-Postgres niceties baked in:
 *
 * - SSL: explicit via DATABASE_SSL (require|prefer|allow); auto-enabled to
 *   "require" for Supabase/Neon hosts which mandate TLS. Local/Render-internal
 *   stays off.
 * - prepare:false for the Supabase connection pooler (Supavisor) — transaction
 *   mode doesn't support prepared statements, and session mode is fine without
 *   them. Detected by the "pooler.supabase.com" host.
 */
export function getPostgresOptions(max: number) {
  const cs = getConnectionString();
  const isSupabasePooler = /pooler\.supabase\.com/i.test(cs);
  const isManagedTls = /supabase\.(co|com)|neon\.tech/i.test(cs);

  const sslEnv = process.env.DATABASE_SSL as
    | "require"
    | "prefer"
    | "allow"
    | undefined;
  const ssl = sslEnv ?? (isManagedTls ? "require" : undefined);

  return {
    max,
    prepare: !isSupabasePooler,
    ...(ssl ? { ssl } : {}),
  };
}
