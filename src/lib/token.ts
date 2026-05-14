import { createHash, randomBytes } from "crypto";

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Hash a code with a per-row salt: `sha256(salt + ":" + code)` → hex string. */
export function hashCode(code: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

/** Stored token format: `<salt>:<hash>` so we can verify later. */
export function encodeToken(code: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${hashCode(code, salt)}`;
}

export function verifyToken(code: string, stored: string): boolean {
  const colonIndex = stored.indexOf(":");
  if (colonIndex < 0) {
    // Legacy plain-text token — accept during migration window
    return stored === code;
  }
  const salt = stored.slice(0, colonIndex);
  const expectedHash = stored.slice(colonIndex + 1);
  return hashCode(code, salt) === expectedHash;
}
