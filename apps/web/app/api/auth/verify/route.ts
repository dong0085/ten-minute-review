import type { NextRequest } from "next/server";
import { consumeVerificationToken, getUserByEmail, updateUser } from "@tmr/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return jsonError("Invalid or missing token", 400);
    }
    const db = getDb();
    const row = await consumeVerificationToken(db, { token, purpose: "verify_email" });
    if (!row) {
      return jsonError("Invalid or expired token", 400);
    }
    const user = await getUserByEmail(db, row.identifier);
    if (!user) {
      return jsonError("Invalid or expired token", 400);
    }
    await updateUser(db, user.id, { emailVerifiedAt: new Date() });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
