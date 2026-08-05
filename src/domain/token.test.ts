import { describe, it, expect } from "vitest";
import { generateCode, hashCode, encodeToken, verifyToken } from "./token";

describe("generateCode", () => {
  it("always returns exactly six digits", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateCode()).toMatch(/^\d{6}$/);
    }
  });

  it("stays within 100000-999999 so it never renders with a leading zero", () => {
    for (let i = 0; i < 200; i++) {
      const n = Number(generateCode());
      expect(n).toBeGreaterThanOrEqual(100000);
      expect(n).toBeLessThanOrEqual(999999);
    }
  });
});

describe("hashCode", () => {
  it("is deterministic for the same salt and code", () => {
    expect(hashCode("123456", "abc")).toBe(hashCode("123456", "abc"));
  });

  it("produces a different digest when only the salt differs", () => {
    expect(hashCode("123456", "abc")).not.toBe(hashCode("123456", "abd"));
  });

  it("produces a different digest when only the code differs", () => {
    expect(hashCode("123456", "abc")).not.toBe(hashCode("123457", "abc"));
  });

  it("returns a 64-char hex sha256 digest", () => {
    expect(hashCode("123456", "abc")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("encodeToken", () => {
  it("stores as <salt>:<hash>, never the code itself", () => {
    const stored = encodeToken("123456");
    const [salt, hash] = stored.split(":");
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(stored).not.toContain("123456");
  });

  it("salts each token independently, so the same code encodes differently", () => {
    expect(encodeToken("123456")).not.toBe(encodeToken("123456"));
  });
});

describe("verifyToken", () => {
  it("accepts the code that produced the token", () => {
    expect(verifyToken("123456", encodeToken("123456"))).toBe(true);
  });

  it("rejects any other code", () => {
    const stored = encodeToken("123456");
    expect(verifyToken("123457", stored)).toBe(false);
    expect(verifyToken("", stored)).toBe(false);
    expect(verifyToken("1234567", stored)).toBe(false);
  });

  it("round-trips across independently salted tokens of the same code", () => {
    const a = encodeToken("424242");
    const b = encodeToken("424242");
    expect(a).not.toBe(b);
    expect(verifyToken("424242", a)).toBe(true);
    expect(verifyToken("424242", b)).toBe(true);
  });

  it("splits on the FIRST colon, so a code containing a colon still verifies", () => {
    const stored = encodeToken("12:456");
    expect(verifyToken("12:456", stored)).toBe(true);
    expect(verifyToken("12", stored)).toBe(false);
  });

  it("falls back to plain-text comparison for legacy colon-less tokens", () => {
    // Documented migration-window behaviour: pre-hash tokens were stored raw.
    expect(verifyToken("123456", "123456")).toBe(true);
    expect(verifyToken("123456", "999999")).toBe(false);
  });

  it("rejects a malformed token whose hash segment is empty", () => {
    expect(verifyToken("123456", "somesalt:")).toBe(false);
  });
});
