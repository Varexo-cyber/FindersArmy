import "server-only";
import type { Prisma } from "@prisma/client";
import { db, type Tx } from "./db";

export async function audit(
  entry: { actorUserId?: string | null; action: string; entity: string; entityId: string; before?: unknown; after?: unknown },
  tx: Tx = db,
) {
  await tx.auditLog.create({
    data: {
      actorUserId: entry.actorUserId ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      before: (entry.before ?? undefined) as Prisma.InputJsonValue | undefined,
      after: (entry.after ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}
