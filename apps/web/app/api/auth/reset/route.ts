import { hash } from "@node-rs/argon2";
import { z } from "zod";
import { consumeVerificationToken, getUserByEmail, updateUser } from "@tmr/db";
import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await readJson(request, resetSchema);
    const db = getDb();
    const row = await consumeVerificationToken(db, {
      token: body.token,
      purpose: "reset_password",
    });
    if (!row) {
      return jsonError("Invalid or expired token", 400);
    }
    const user = await getUserByEmail(db, row.identifier);
    if (!user) {
      return jsonError("Invalid or expired token", 400);
    }
    await updateUser(db, user.id, { passwordHash: await hash(body.password) });
    return jsonOk({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
