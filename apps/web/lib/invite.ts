import { getReferralByCode } from "@tmr/db";
import type { Db } from "@tmr/db";
import { env } from "./env";

export type InviteResolution = { referrerUserId: string | null };

export async function resolveInviteCode(
  db: Db,
  code: string | null | undefined,
): Promise<InviteResolution | null> {
  if (!code) {
    return null;
  }
  if (env.inviteCode && code === env.inviteCode) {
    return { referrerUserId: null };
  }
  const referral = await getReferralByCode(db, code);
  if (!referral) {
    return null;
  }
  return { referrerUserId: referral.referrerUserId };
}
