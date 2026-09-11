import { createUnsubscribeToken } from "@tmr/core/node";
import {
  getEmailPreferences,
  getEmailSend,
  getQuizWithQuestionsForUser,
  getUserById,
  listQuizzesForUserOnDate,
  recordEmailSend,
} from "@tmr/db";
import type { Db } from "@tmr/db";
import { env } from "../env";
import { renderDailyQuizEmail, sendEmail } from "../email";
import type { DailyQuizEmailEntry } from "../email";

const UNSUBSCRIBE_TOKEN_DAYS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

export type EmailQuestion = {
  position: number;
  category: string;
  type: string;
  stem: string;
  options: string[] | null;
};

export type EmailQuizData = {
  classroomName: string;
  quiz: { id: string; classroomId: string };
  questions: EmailQuestion[];
};

export function buildEmailEntries(
  appUrl: string,
  quizzes: EmailQuizData[],
): DailyQuizEmailEntry[] {
  return quizzes.map((entry) => ({
    classroomName: entry.classroomName,
    quizUrl: `${appUrl}/classrooms/${entry.quiz.classroomId}/quiz/${entry.quiz.id}`,
    questions: entry.questions.map((question) => ({
      position: question.position,
      category: question.category,
      type: question.type,
      stem: question.stem,
      options: question.options,
    })),
  }));
}

export function withUnsubscribeFooter(
  html: string,
  text: string,
  unsubscribeUrl: string,
): { html: string; text: string } {
  const htmlFooter = `<p style="color: #737373; font-size: 13px;">You receive this email because daily quizzes are on. <a href="${unsubscribeUrl}">Unsubscribe</a></p>`;
  const textFooter = `\nYou receive this email because daily quizzes are on.\nUnsubscribe: ${unsubscribeUrl}\n`;
  return { html: `${html}\n${htmlFooter}`, text: `${text}${textFooter}` };
}

function requireString(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`send_email job payload is missing ${key}`);
  }
  return value;
}

export async function handleSendEmailJob(
  db: Db,
  payload: Record<string, unknown>,
): Promise<void> {
  const userId = requireString(payload, "userId");
  const quizDate = requireString(payload, "quizDate");

  const alreadySent = await getEmailSend(db, userId, quizDate);
  if (alreadySent) {
    return;
  }

  const preferences = await getEmailPreferences(db, userId);
  if (preferences && (!preferences.dailyEnabled || preferences.unsubscribedAt !== null)) {
    return;
  }

  const user = await getUserById(db, userId);
  if (!user) {
    throw new Error(`user ${userId} not found`);
  }

  const rows = await listQuizzesForUserOnDate(db, userId, quizDate);
  if (rows.length === 0) {
    return;
  }

  const quizzes: EmailQuizData[] = [];
  for (const row of rows) {
    const full = await getQuizWithQuestionsForUser(db, userId, row.quiz.id);
    if (!full) {
      continue;
    }
    quizzes.push({
      classroomName: row.classroomName,
      quiz: { id: full.quiz.id, classroomId: full.quiz.classroomId },
      questions: full.questions.map((question) => ({
        position: question.position,
        category: question.category,
        type: question.type,
        stem: question.stem,
        options: question.options,
      })),
    });
  }
  if (quizzes.length === 0) {
    return;
  }

  const entries = buildEmailEntries(env.appUrl, quizzes);
  const message = renderDailyQuizEmail({ username: user.username, entries });
  const unsubscribeUrl = `${env.appUrl}/unsubscribe?token=${createUnsubscribeToken(
    userId,
    env.authSecret,
    new Date(Date.now() + UNSUBSCRIBE_TOKEN_DAYS * DAY_MS),
  )}`;
  const { html, text } = withUnsubscribeFooter(message.html, message.text, unsubscribeUrl);

  const { id } = await sendEmail({
    to: user.email,
    subject: message.subject,
    html,
    text,
  });

  const recorded = await recordEmailSend(db, {
    userId,
    sentOn: quizDate,
    classroomIds: quizzes.map((quiz) => quiz.quiz.classroomId),
    providerMessageId: id,
  });
  if (!recorded) {
    console.log(`[worker] send_email ${userId} ${quizDate}: already recorded, skipping`);
    return;
  }
  console.log(`[worker] send_email ${userId} ${quizDate}: ${entries.length} classroom(s)`);
}
