import { signValue, verifySignedValue } from "@tmr/core/node";

export type AttemptTokenPayload = {
  quizId: string;
  startedAt: number;
  expiresAt: number;
};

export function createAttemptToken(payload: AttemptTokenPayload, secret: string): string {
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${encoded}.${signValue(encoded, secret)}`;
}

export function verifyAttemptToken(
  token: string,
  secret: string,
  now: number = Date.now(),
): AttemptTokenPayload | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !verifySignedValue(encoded, signature, secret)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as AttemptTokenPayload;
    if (
      typeof parsed.quizId !== "string" ||
      typeof parsed.startedAt !== "number" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    if (parsed.expiresAt < now) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
