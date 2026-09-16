import type { Category } from "@tmr/core";
import { countBankByCategory, getClassroom } from "@tmr/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { getCurrentUserOrGuest } from "@/lib/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const current = await getCurrentUserOrGuest();
    if (!current) {
      return jsonError("Unauthorized", 401);
    }
    const { user } = current;
    const { id } = await context.params;
    const db = getDb();
    const classroom = await getClassroom(db, user.id, id);
    if (!classroom) {
      return jsonError("Not found", 404);
    }
    const counts: Record<Category, number> = {
      vocabulary: 0,
      phrase: 0,
      grammar: 0,
      expression: 0,
      comprehension: 0,
    };
    const rows = await countBankByCategory(db, user.id, id);
    for (const row of rows) {
      counts[row.category] = row.value;
    }
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
    return jsonOk({ counts, total });
  } catch (error) {
    return handleRouteError(error);
  }
}
