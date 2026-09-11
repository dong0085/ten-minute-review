import { and, eq } from "drizzle-orm";
import type { QuizKind } from "@tmr/core";
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
    kind: QuizKind;
    quizId?: string | null;
    classroomIds: string[];
    providerMessageId?: string | null;
  },
) {
  const rows = await db
    .insert(emailSends)
    .values({
      userId: input.userId,
      sentOn: input.sentOn,
      kind: input.kind,
      quizId: input.quizId ?? null,
      classroomIds: input.classroomIds,
      providerMessageId: input.providerMessageId ?? null,
    })
    .onConflictDoNothing()
    .returning();
  return rows[0] ?? null;
}

export async function getEmailSend(
  db: Db,
  userId: string,
  sentOn: string,
  kind: QuizKind = "daily",
) {
  const [row] = await db
    .select()
    .from(emailSends)
    .where(
      and(
        eq(emailSends.userId, userId),
        eq(emailSends.sentOn, sentOn),
        eq(emailSends.kind, kind),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function getEmailSendByQuiz(db: Db, userId: string, quizId: string) {
  const [row] = await db
    .select()
    .from(emailSends)
    .where(and(eq(emailSends.userId, userId), eq(emailSends.quizId, quizId)))
    .limit(1);
  return row ?? null;
}
