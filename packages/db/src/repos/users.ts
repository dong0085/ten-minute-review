import { and, eq, gt, lt } from "drizzle-orm";
import type { TokenPurpose } from "@tmr/core";
import type { Db } from "../client";
import { users, verificationTokens } from "../schema/users";

export type CreateUserInput = {
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
  passwordHash?: string | null;
  uiLanguage?: string;
  timezone?: string;
  isGuest?: boolean;
  emailVerifiedAt?: Date | null;
};

export type UpdateUserInput = {
  username?: string | null;
  avatarUrl?: string | null;
  passwordHash?: string | null;
  uiLanguage?: string;
  timezone?: string;
  isGuest?: boolean;
  emailVerifiedAt?: Date | null;
};

export async function getUserById(db: Db, id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export async function getUserByEmail(db: Db, email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function createUser(db: Db, input: CreateUserInput) {
  const [user] = await db
    .insert(users)
    .values({
      email: input.email,
      username: input.username ?? null,
      avatarUrl: input.avatarUrl ?? null,
      passwordHash: input.passwordHash ?? null,
      uiLanguage: input.uiLanguage ?? "en",
      timezone: input.timezone ?? "UTC",
      isGuest: input.isGuest ?? false,
      emailVerifiedAt: input.emailVerifiedAt ?? null,
    })
    .returning();
  return user;
}

export async function createGuestUser(
  db: Db,
  input?: { uiLanguage?: string; timezone?: string },
) {
  const guestId = crypto.randomUUID();
  const [user] = await db
    .insert(users)
    .values({
      id: guestId,
      email: `guest-${guestId}@guest.local`,
      isGuest: true,
      uiLanguage: input?.uiLanguage ?? "en",
      timezone: input?.timezone ?? "America/Toronto",
    })
    .returning();
  return user;
}

export async function cleanupExpiredGuests(
  db: Db,
  maxAgeMs = 24 * 60 * 60 * 1000,
) {
  const cutoff = new Date(Date.now() - maxAgeMs);
  const deleted = await db
    .delete(users)
    .where(and(eq(users.isGuest, true), lt(users.createdAt, cutoff)))
    .returning({ id: users.id });
  return deleted.length;
}

export async function updateUser(db: Db, id: string, patch: UpdateUserInput) {
  const [user] = await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user ?? null;
}

export async function deleteUser(db: Db, id: string) {
  await db.delete(users).where(eq(users.id, id));
}

export async function createVerificationToken(
  db: Db,
  input: { identifier: string; token: string; expires: Date; purpose: TokenPurpose },
) {
  await db.insert(verificationTokens).values(input);
}

export async function consumeVerificationToken(
  db: Db,
  input: { identifier?: string; token: string; purpose: TokenPurpose },
) {
  const conditions = [
    eq(verificationTokens.token, input.token),
    eq(verificationTokens.purpose, input.purpose),
    gt(verificationTokens.expires, new Date()),
  ];
  if (input.identifier) {
    conditions.push(eq(verificationTokens.identifier, input.identifier));
  }
  const [row] = await db
    .select()
    .from(verificationTokens)
    .where(and(...conditions))
    .limit(1);
  if (!row) {
    return null;
  }
  await db
    .delete(verificationTokens)
    .where(
      and(
        eq(verificationTokens.identifier, row.identifier),
        eq(verificationTokens.token, row.token),
      ),
    );
  return row;
}

export async function deleteExpiredVerificationTokens(db: Db) {
  await db.delete(verificationTokens).where(lt(verificationTokens.expires, new Date()));
}
