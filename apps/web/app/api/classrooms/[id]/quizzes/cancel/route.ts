import {
  countManualQuizzes,
  getActiveComposeJob,
  getClassroom,
  markJobCancelled,
  requestJobCancel,
} from "@tmr/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError("Unauthorized", 401);
    }
    const { id } = await context.params;
    const db = getDb();
    const classroom = await getClassroom(db, user.id, id);
    if (!classroom) {
      return jsonError("Not found", 404);
    }

    const job = await getActiveComposeJob(db, id);
    if (!job) {
      return jsonOk({ outcome: "none" });
    }
    if (job.status === "pending") {
      await markJobCancelled(db, job.id);
      return jsonOk({ outcome: "stopped" });
    }
    if ((await countManualQuizzes(db, user.id, job.createdAt, id)) > 0) {
      return jsonOk({ outcome: "too_late" });
    }
    await requestJobCancel(db, job.id);
    return jsonOk({ outcome: "stopped" });
  } catch (error) {
    return handleRouteError(error);
  }
}
