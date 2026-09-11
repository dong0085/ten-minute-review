import { z } from "zod";
import { FREE_TIER } from "@tmr/core";
import {
  bankSize,
  countClassrooms,
  createClassroom,
  listClassrooms,
  listQuizzesForUserOnDate,
} from "@tmr/db";
import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { localDateFor } from "@/app/api/_lib/quiz";

const createClassroomSchema = z.object({
  name: z.string().trim().min(1).max(80),
  targetLanguage: z.string().trim().min(2).max(10),
  nativeLanguage: z.string().trim().min(2).max(10),
});

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError("Unauthorized", 401);
    }
    const db = getDb();
    const classrooms = await listClassrooms(db, user.id);
    const today = localDateFor(user.timezone);
    const todaysQuizzes = await listQuizzesForUserOnDate(db, user.id, today);
    const quizByClassroom = new Map(
      todaysQuizzes.map((row) => [row.quiz.classroomId, row.quiz.id]),
    );
    const payload = await Promise.all(
      classrooms.map(async (classroom) => ({
        id: classroom.id,
        name: classroom.name,
        targetLanguage: classroom.targetLanguage,
        nativeLanguage: classroom.nativeLanguage,
        autoStopDays: classroom.autoStopDays,
        activeUntil: classroom.activeUntil,
        archivedAt: classroom.archivedAt,
        isActive: classroom.activeUntil.getTime() > Date.now(),
        bankSize: await bankSize(db, classroom.id),
        todayQuizId: quizByClassroom.get(classroom.id) ?? null,
      })),
    );
    return jsonOk({ classrooms: payload });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError("Unauthorized", 401);
    }
    const body = await readJson(request, createClassroomSchema);
    const db = getDb();
    const existingCount = await countClassrooms(db, user.id);
    if (existingCount >= FREE_TIER.classrooms) {
      return jsonError("Free plan is limited to 3 classrooms", 403);
    }
    const classroom = await createClassroom(db, user.id, {
      name: body.name,
      targetLanguage: body.targetLanguage,
      nativeLanguage: body.nativeLanguage,
      activeUntil: new Date(),
    });
    return jsonOk({ classroom }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
