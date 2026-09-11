import { and, eq } from "drizzle-orm";
import type { Db } from "../client";
import { emailPreferences, emailSends } from "../schema/email";

export type EmailPreferencesInput = {
  dailyEnabled?: boolean;
  sendHourLocal?: number;
  unsubscribedAt?: Date | null;
};

export async function getEmailPreferences(db: Db, userId: string) {
  const [row] = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function upsertEmailPreferences(
  db: Db,
  userId: string,
  patch: EmailPreferencesInput,
) {
  const [row] = await db
    .insert(emailPreferences)
    .values({
      userId,
      dailyEnabled: patch.dailyEnabled ?? true,
      sendHourLocal: patch.sendHourLocal ?? 7,
      unsubscribedAt: patch.unsubscribedAt ?? null,
    })
    .onConflictDoUpdate({
      target: emailPreferences.userId,
      set: patch,
    })
    .returning();
  return row;
}

export async function recordEmailSend(
  db: Db,
  input: {
    userId: string;
    sentOn: string;
    classroomIds: string[];
    providerMessageId?: string | null;
  },
) {
  const rows = await db
    .insert(emailSends)
    .values({
      userId: input.userId,
      sentOn: input.sentOn,
      classroomIds: input.classroomIds,
      providerMessageId: input.providerMessageId ?? null,
    })
    .onConflictDoNothing({ target: [emailSends.userId, emailSends.sentOn] })
    .returning();
  return rows[0] ?? null;
}

export async function getEmailSend(db: Db, userId: string, sentOn: string) {
  const [row] = await db
    .select()
    .from(emailSends)
    .where(and(eq(emailSends.userId, userId), eq(emailSends.sentOn, sentOn)))
    .limit(1);
  return row ?? null;
}
