"use server";

import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, destroySession, isAdminName } from "@/lib/auth";
import { displayNameSchema } from "@/lib/validation";

export type AuthState = { error?: string } | null;

/**
 * Sign in by display name. Upserts the user (case-insensitive match on name)
 * and sets the session cookie. First sign-in with an allowlisted name grants
 * admin.
 */
export async function signInAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = displayNameSchema.safeParse(formData.get("name"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid name" };
  }
  const name = parsed.data;
  const admin = isAdminName(name);

  // Case-insensitive lookup so "nacho" and "Nacho" are the same person.
  const existing = await db
    .select()
    .from(users)
    .where(sql`lower(${users.name}) = lower(${name})`)
    .limit(1);

  let userId: number;
  if (existing[0]) {
    userId = existing[0].id;
    // Keep admin flag in sync with the allowlist.
    if (existing[0].isAdmin !== admin) {
      await db
        .update(users)
        .set({ isAdmin: admin })
        .where(eq(users.id, userId));
    }
  } else {
    const inserted = await db
      .insert(users)
      .values({ name, isAdmin: admin })
      .returning({ id: users.id });
    userId = inserted[0].id;
  }

  await createSession(userId);
  redirect("/matches");
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/signin");
}
