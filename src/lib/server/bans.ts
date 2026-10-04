import "server-only";
import type { BanKind, Prisma } from "@prisma/client";
import { db } from "./db";
import { privacyHash } from "./hash";

/** Normalise before hashing, so "Jan@X.nl " and "jan@x.nl" are the same identity. */
function normalise(kind: BanKind, value: string): string {
  return kind === "EMAIL" ? value.trim().toLowerCase() : value.replace(/\D/g, "");
}

export async function isBanned(kind: BanKind, value: string | null | undefined): Promise<boolean> {
  if (!value) return false;
  const hit = await db.ban.findUnique({ where: { kind_valueHash: { kind, valueHash: privacyHash(normalise(kind, value)) } } });
  return Boolean(hit);
}

export async function addBan(kind: BanKind, value: string, reason: string, createdById: string, tx: Prisma.TransactionClient = db) {
  const valueHash = privacyHash(normalise(kind, value));
  await tx.ban.upsert({ where: { kind_valueHash: { kind, valueHash } }, create: { kind, valueHash, reason, createdById }, update: { reason } });
}

export async function removeBan(kind: BanKind, value: string, tx: Prisma.TransactionClient = db) {
  await tx.ban.deleteMany({ where: { kind, valueHash: privacyHash(normalise(kind, value)) } });
}
