import { describe, expect, it } from "vitest";
import {
  createUnsubscribeToken,
  signValue,
  verifySignedValue,
  verifyUnsubscribeToken,
} from "./node";

const SECRET = "test-secret";

describe("signValue", () => {
  it("verifies a round trip", () => {
    const signature = signValue("payload", SECRET);
    expect(verifySignedValue("payload", signature, SECRET)).toBe(true);
  });

  it("rejects a wrong secret or tampered payload", () => {
    const signature = signValue("payload", SECRET);
    expect(verifySignedValue("payload", signature, "other")).toBe(false);
    expect(verifySignedValue("tampered", signature, SECRET)).toBe(false);
    expect(verifySignedValue("payload", "not-a-signature", SECRET)).toBe(false);
  });
});

describe("unsubscribe tokens", () => {
  it("round-trips the user id", () => {
    const token = createUnsubscribeToken("user-1", SECRET, new Date(Date.now() + 1000));
    expect(verifyUnsubscribeToken(token, SECRET)).toBe("user-1");
  });

  it("rejects expired tokens", () => {
    const token = createUnsubscribeToken("user-1", SECRET, new Date(Date.now() - 1000));
    expect(verifyUnsubscribeToken(token, SECRET)).toBeNull();
  });

  it("rejects tampered and malformed tokens", () => {
    const token = createUnsubscribeToken("user-1", SECRET, new Date(Date.now() + 1000));
    expect(verifyUnsubscribeToken(`${token}x`, SECRET)).toBeNull();
    expect(verifyUnsubscribeToken("garbage", SECRET)).toBeNull();
    expect(verifyUnsubscribeToken("", SECRET)).toBeNull();
  });
});
