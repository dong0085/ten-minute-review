import { listQuizzesForUser } from "@tmr/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError("Unauthorized", 401);
    }
    const quizzes = await listQuizzesForUser(getDb(), user.id);
    return jsonOk({ quizzes });
  } catch (error) {
    return handleRouteError(error);
  }
}
