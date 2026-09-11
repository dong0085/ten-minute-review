import type { NextRequest } from "next/server";
import { listAttemptsForQuiz } from "@tmr/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { buildQuizPayload } from "@/app/api/_lib/quiz";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError("Unauthorized", 401);
    }
    const { id } = await context.params;
    const quiz = await buildQuizPayload(user.id, id);
    if (!quiz) {
      return jsonError("Not found", 404);
    }
    if (request.nextUrl.searchParams.get("includeAttempts") === "1") {
      const rows = await listAttemptsForQuiz(getDb(), user.id, id);
      const attempts = rows.map((attempt) => ({
        id: attempt.id,
        submittedAt: attempt.submittedAt,
        correctCount: attempt.correctCount,
        questionCount: attempt.questionCount,
        durationMs: attempt.durationMs,
      }));
      return jsonOk({ quiz, attempts });
    }
    return jsonOk({ quiz });
  } catch (error) {
    return handleRouteError(error);
  }
}
