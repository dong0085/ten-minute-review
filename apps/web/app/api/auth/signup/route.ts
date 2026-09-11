import { hash } from "@node-rs/argon2";
import { z } from "zod";
import { toUiLocale } from "@tmr/core";
import { randomToken } from "@tmr/core/node";
import {
  createUser,
  createVerificationToken,
  getUserByEmail,
  recordReferralSignup,
  upsertEmailPreferences,
} from "@tmr/db";
import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api";
import { getDb } from "@/lib/db";
import { renderVerificationEmail, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { resolveInviteCode } from "@/lib/invite";

const signupSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  inviteCode: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).max(64).optional(),
  uiLanguage: z.string().trim().min(2).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await readJson(request, signupSchema);
    const db = getDb();
    const existing = await getUserByEmail(db, body.email);
    if (existing) {
      return jsonError("Email already registered", 409);
    }

    let referrerUserId: string | null = null;
    if (body.inviteCode) {
      const invite = await resolveInviteCode(db, body.inviteCode);
      if (env.inviteOnly && !invite) {
        return jsonError("Invite code required", 403);
      }
      referrerUserId = invite?.referrerUserId ?? null;
    } else if (env.inviteOnly) {
      return jsonError("Invite code required", 403);
    }

    const user = await createUser(db, {
      email: body.email,
      passwordHash: await hash(body.password),
      uiLanguage: body.uiLanguage,
      timezone: body.timezone,
    });

    const token = randomToken();
    await createVerificationToken(db, {
      identifier: body.email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      purpose: "verify_email",
    });
    await sendEmail({
      to: body.email,
      ...renderVerificationEmail(
        `${env.appUrl}/verify?token=${token}`,
        toUiLocale(body.uiLanguage),
      ),
    });

    if (referrerUserId) {
      await recordReferralSignup(db, {
        referrerUserId,
        sourceCode: body.inviteCode ?? null,
        referredUserId: user.id,
      });
    }
    await upsertEmailPreferences(db, user.id, {
      dailyEnabled: true,
      sendHourLocal: 7,
    });

    return jsonOk({ ok: true }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
