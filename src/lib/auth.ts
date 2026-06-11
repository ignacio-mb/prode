import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

const COOKIE_NAME = "prode_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year — it's a long tournament + friends.

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 8) {
    throw new Error(
      "SESSION_SECRET is not set (or too short). Set it in your environment.",
    );
  }
  return s;
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

/** token = `${userId}.${hmac(userId)}` */
function makeToken(userId: number): string {
  const v = String(userId);
  return `${v}.${sign(v)}`;
}

function readToken(token: string | undefined): number | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const value = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(value);
  // Constant-time compare.
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function isAdminName(name: string): boolean {
  const allow = (process.env.ADMIN_NAMES ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(name.trim().toLowerCase());
}

/** Set the session cookie for a user (call from a Server Action / Route Handler). */
export async function createSession(userId: number): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, makeToken(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Current user or null. Cached per request would be nice; kept simple. */
export async function getCurrentUser(): Promise<User | null> {
  const jar = await cookies();
  const id = readToken(jar.get(COOKIE_NAME)?.value);
  if (!id) return null;
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!user.isAdmin) throw new Error("FORBIDDEN");
  return user;
}
