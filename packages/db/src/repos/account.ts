import { eq, inArray } from "drizzle-orm";
import type { Db } from "../client";
import { classrooms } from "../schema/classrooms";
import { knowledgePoints, passages } from "../schema/bank";
import { uploads } from "../schema/classrooms";
import { questions, quizzes, attempts, attemptAnswers } from "../schema/quizzes";
import { emailPreferences, emailSends } from "../schema/email";
import { referrals, subscriptions } from "../schema/billing";
import { users } from "../schema/users";

export async function exportUserData(db: Db, userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const classroomRows = await db.select().from(classrooms).where(eq(classrooms.userId, userId));
  const classroomIds = classroomRows.map((classroom) => classroom.id);

  const uploadRows = classroomIds.length
    ? await db.select().from(uploads).where(inArray(uploads.classroomId, classroomIds))
    : [];
  const knowledgePointRows = classroomIds.length
    ? await db.select().from(knowledgePoints).where(inArray(knowledgePoints.classroomId, classroomIds))
    : [];
  const passageRows = classroomIds.length
    ? await db.select().from(passages).where(inArray(passages.classroomId, classroomIds))
    : [];
  const quizRows = await db.select().from(quizzes).where(eq(quizzes.userId, userId));
  const quizIds = quizRows.map((quiz) => quiz.id);
  const questionRows = quizIds.length
    ? await db.select().from(questions).where(inArray(questions.quizId, quizIds))
    : [];
  const attemptRows = await db.select().from(attempts).where(eq(attempts.userId, userId));
  const attemptIds = attemptRows.map((attempt) => attempt.id);
  const attemptAnswerRows = attemptIds.length
    ? await db.select().from(attemptAnswers).where(inArray(attemptAnswers.attemptId, attemptIds))
    : [];
  const [preferences] = await db
    .select()
    .from(emailPreferences)
    .where(eq(emailPreferences.userId, userId))
    .limit(1);
  const emailSendRows = await db.select().from(emailSends).where(eq(emailSends.userId, userId));
  const subscriptionRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));
  const referralRows = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referrerUserId, userId));

  return {
    exportedAt: new Date().toISOString(),
    user,
    classrooms: classroomRows,
    uploads: uploadRows,
    knowledgePoints: knowledgePointRows,
    passages: passageRows,
    quizzes: quizRows,
    questions: questionRows,
    attempts: attemptRows,
    attemptAnswers: attemptAnswerRows,
    emailPreferences: preferences ?? null,
    emailSends: emailSendRows,
    subscriptions: subscriptionRows,
    referrals: referralRows,
  };
}

export type UserExport = Awaited<ReturnType<typeof exportUserData>>;
