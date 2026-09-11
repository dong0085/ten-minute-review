import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import type { Category } from "@tmr/core";
import type { Db } from "../client";
import { classrooms } from "../schema/classrooms";
import { knowledgePoints } from "../schema/bank";
import { attempts, attemptAnswers, questions } from "../schema/quizzes";

export type ActivityStats = {
  attemptCount: number;
  quizCount: number;
  answeredCount: number;
  correctCount: number;
  totalDurationMs: number;
  activeDays: number;
};

export async function getActivityStats(
  db: Db,
  userId: string,
  timezone: string,
): Promise<ActivityStats> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [[totals], [days]] = await Promise.all([
    db
      .select({
        attemptCount: sql<number>`count(*)::int`,
        quizCount: sql<number>`count(distinct ${attempts.quizId})::int`,
        answeredCount: sql<number>`coalesce(sum(${attempts.questionCount}), 0)::int`,
        correctCount: sql<number>`coalesce(sum(${attempts.correctCount}), 0)::int`,
        totalDurationMs: sql<number>`coalesce(sum(${attempts.durationMs}), 0)::bigint`,
      })
      .from(attempts)
      .where(eq(attempts.userId, userId)),
    db
      .select({
        activeDays: sql<number>`count(distinct (${attempts.submittedAt} AT TIME ZONE ${timezone})::date)::int`,
      })
      .from(attempts)
      .where(and(eq(attempts.userId, userId), gte(attempts.submittedAt, since))),
  ]);
  return {
    attemptCount: Number(totals?.attemptCount ?? 0),
    quizCount: Number(totals?.quizCount ?? 0),
    answeredCount: Number(totals?.answeredCount ?? 0),
    correctCount: Number(totals?.correctCount ?? 0),
    totalDurationMs: Number(totals?.totalDurationMs ?? 0),
    activeDays: Number(days?.activeDays ?? 0),
  };
}

export type CategoryLearning = {
  category: Category;
  answered: number;
  correct: number;
};

export type LearningStats = {
  categories: CategoryLearning[];
  practicedPoints: number;
  masteredPoints: number;
  bankPoints: number;
  gaps: Category[];
};

export async function getLearningStats(db: Db, userId: string): Promise<LearningStats> {
  const [categoryRows, perPointRows, bankRows] = await Promise.all([
    db
      .select({
        category: questions.category,
        answered: sql<number>`count(*)::int`,
        correct: sql<number>`count(*) filter (where ${attemptAnswers.isCorrect})::int`,
      })
      .from(attemptAnswers)
      .innerJoin(attempts, eq(attemptAnswers.attemptId, attempts.id))
      .innerJoin(questions, eq(attemptAnswers.questionId, questions.id))
      .where(eq(attempts.userId, userId))
      .groupBy(questions.category),
    db
      .select({
        knowledgePointId: questions.knowledgePointId,
        correct: sql<number>`count(*) filter (where ${attemptAnswers.isCorrect})::int`,
      })
      .from(attemptAnswers)
      .innerJoin(attempts, eq(attemptAnswers.attemptId, attempts.id))
      .innerJoin(questions, eq(attemptAnswers.questionId, questions.id))
      .where(eq(attempts.userId, userId))
      .groupBy(questions.knowledgePointId),
    db
      .select({
        category: knowledgePoints.category,
        value: sql<number>`count(*)::int`,
      })
      .from(knowledgePoints)
      .innerJoin(classrooms, eq(knowledgePoints.classroomId, classrooms.id))
      .where(and(eq(classrooms.userId, userId), isNull(knowledgePoints.retiredAt)))
      .groupBy(knowledgePoints.category),
  ]);

  const practicedCategories = new Set(categoryRows.map((row) => row.category as Category));
  const bankCategories = bankRows.map((row) => row.category as Category);

  return {
    categories: categoryRows.map((row) => ({
      category: row.category as Category,
      answered: Number(row.answered),
      correct: Number(row.correct),
    })),
    practicedPoints: perPointRows.length,
    masteredPoints: perPointRows.filter((row) => Number(row.correct) >= 2).length,
    bankPoints: bankRows.reduce((total, row) => total + Number(row.value), 0),
    gaps: bankCategories.filter((category) => !practicedCategories.has(category)),
  };
}

export type AttemptScore = {
  id: string;
  submittedAt: Date;
  correctCount: number;
  questionCount: number;
};

export async function listRecentAttemptScores(
  db: Db,
  userId: string,
  limit = 10,
): Promise<AttemptScore[]> {
  const rows = await db
    .select({
      id: attempts.id,
      submittedAt: attempts.submittedAt,
      correctCount: attempts.correctCount,
      questionCount: attempts.questionCount,
    })
    .from(attempts)
    .where(eq(attempts.userId, userId))
    .orderBy(desc(attempts.submittedAt))
    .limit(limit);
  return rows.reverse();
}

export type RecentMiss = {
  knowledgePointId: string;
  stem: string;
  category: Category;
  missedAt: Date;
};

export async function listRecentMissesForUser(
  db: Db,
  userId: string,
  days = 30,
  limit = 5,
): Promise<RecentMiss[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      knowledgePointId: questions.knowledgePointId,
      stem: questions.stem,
      category: questions.category,
      missedAt: attempts.submittedAt,
    })
    .from(attemptAnswers)
    .innerJoin(attempts, eq(attemptAnswers.attemptId, attempts.id))
    .innerJoin(questions, eq(attemptAnswers.questionId, questions.id))
    .where(
      and(
        eq(attempts.userId, userId),
        eq(attemptAnswers.isCorrect, false),
        gte(attempts.submittedAt, since),
      ),
    )
    .orderBy(desc(attempts.submittedAt))
    .limit(limit * 4);

  const seen = new Set<string>();
  const unique: RecentMiss[] = [];
  for (const row of rows) {
    if (seen.has(row.knowledgePointId)) {
      continue;
    }
    seen.add(row.knowledgePointId);
    unique.push({ ...row, category: row.category as Category });
    if (unique.length >= limit) {
      break;
    }
  }
  return unique;
}
