import { getOrCreateReferralCode, listReferralsByReferrer } from "@tmr/db";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getDb } from "@/lib/db";
import { env } from "@/lib/env";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return jsonError("Unauthorized", 401);
    }
    const db = getDb();
    const referral = await getOrCreateReferralCode(db, user.id);
    const referrals = await listReferralsByReferrer(db, user.id);
    const code = referral.code ?? "";
    return jsonOk({
      code,
      shareUrl: `${env.appUrl}/signup?code=${code}`,
      referrals: referrals.map((row) => ({
        id: row.id,
        referredUserId: row.referredUserId,
        status: row.status,
        rewardMonths: row.rewardMonths,
        createdAt: row.createdAt,
        rewardedAt: row.rewardedAt,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
