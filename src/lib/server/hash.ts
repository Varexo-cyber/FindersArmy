import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { env } from "../env";

/** One-way hash for IPs and user agents: lets us spot self-referrals without storing raw identifiers. */
export function privacyHash(value: string): string {
  return createHash("sha256").update(`${env().HASH_SALT}:${value}`).digest("hex").slice(0, 32);
}

export async function requestFingerprint() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
  const ua = h.get("user-agent") ?? "unknown";
  return { ip, ipHash: privacyHash(ip), uaHash: privacyHash(ua) };
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Short, unambiguous codes for referral links (no 0/o/1/l/i). */
export function randomCode(length = 8): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}
