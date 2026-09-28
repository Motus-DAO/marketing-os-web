import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { NONCE_TTL_MS } from "./constants";

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET environment variable is required in production");
  }
  return secret || "dev-only-insecure-auth-secret";
}

/**
 * Stateless HMAC-signed nonce for Vercel serverless.
 * Format (43 hex chars): rand(16) + exp(11) + mac(16)
 * Replay window is NONCE_TTL_MS; no shared memory / Prisma required.
 */
export function createSignedNonce(address: string): string {
  const rand = randomBytes(8).toString("hex");
  const exp = (Date.now() + NONCE_TTL_MS).toString(16).padStart(11, "0");
  const mac = createHmac("sha256", getAuthSecret())
    .update(`${address.toLowerCase()}:${rand}:${exp}`)
    .digest("hex")
    .slice(0, 16);
  return `${rand}${exp}${mac}`;
}

export function consumeSignedNonce(address: string, nonce: string): boolean {
  if (!/^[0-9a-f]{43}$/i.test(nonce)) return false;

  const rand = nonce.slice(0, 16).toLowerCase();
  const exp = nonce.slice(16, 27).toLowerCase();
  const mac = nonce.slice(27, 43).toLowerCase();

  const expected = createHmac("sha256", getAuthSecret())
    .update(`${address.toLowerCase()}:${rand}:${exp}`)
    .digest("hex")
    .slice(0, 16);

  const macBuf = Buffer.from(mac, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (macBuf.length !== expectedBuf.length) return false;
  if (!timingSafeEqual(macBuf, expectedBuf)) return false;

  const expiresAt = Number.parseInt(exp, 16);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}
