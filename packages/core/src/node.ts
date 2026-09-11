import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function signValue(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function verifySignedValue(value: string, signature: string, secret: string): boolean {
  const expected = signValue(value, secret);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function createUnsubscribeToken(
  userId: string,
  secret: string,
  expiresAt: Date,
): string {
  const payload = `${userId}.${expiresAt.getTime()}`;
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  return `${encoded}.${signValue(payload, secret)}`;
}

export function verifyUnsubscribeToken(
  token: string,
  secret: string,
  now: Date = new Date(),
): string | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) {
    return null;
  }
  const payload = Buffer.from(encoded, "base64url").toString("utf8");
  if (!verifySignedValue(payload, signature, secret)) {
    return null;
  }
  const [userId, expiresAt] = payload.split(".");
  if (!userId || !expiresAt) {
    return null;
  }
  if (Number(expiresAt) < now.getTime()) {
    return null;
  }
  return userId;
}
