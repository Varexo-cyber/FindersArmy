import "server-only";
import { db } from "../db";
import { finderBalances } from "./balances";
import { audit } from "../audit";
import { now } from "../clock";

/** Everything we hold about a user, as JSON (AVG art. 15/20). */
export async function exportUserData(userId: string) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    include: {
      finderProfile: { include: { links: true, ledger: true, payouts: true, leads: { include: { customer: { select: { firstName: true, city: true } }, events: true } } } },
      memberships: { include: { business: { include: { campaigns: true, invoices: true } } } },
      notifications: true,
    },
  });
  return { exportedAt: now().toISOString(), user };
}

export class AccountError extends Error {}

/**
 * Delete an account. Personal data is removed; records we must keep for tax purposes (payouts,
 * invoices) stay, detached from the person where possible.
 */
export async function deleteAccount(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { finderProfile: true, memberships: true } });
  if (user.finderProfile) {
    const b = await finderBalances(user.finderProfile.id);
    if (b.availableCents > 0 || b.pendingPayoutCents > 0) throw new AccountError("BALANCE");
  }
  await db.$transaction(async (tx) => {
    if (user.finderProfile) {
      await tx.finderProfile.update({ where: { id: user.finderProfile.id }, data: { status: "SUSPENDED", city: "", nickname: null, leaderboardOptIn: false, iban: null, ibanHolder: null, parentEmail: null } });
      await tx.referralLink.deleteMany({ where: { finderId: user.finderProfile.id } });
      await tx.finderDevice.deleteMany({ where: { finderId: user.finderProfile.id } });
    }
    for (const m of user.memberships) {
      const owners = await tx.businessMember.count({ where: { businessId: m.businessId } });
      if (owners <= 1) {
        await tx.campaign.updateMany({ where: { businessId: m.businessId, status: "LIVE" }, data: { status: "PAUSED" } });
      }
    }
    await tx.businessMember.deleteMany({ where: { userId } });
    await tx.session.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.user.update({
      where: { id: userId },
      data: { email: `deleted-${userId}@deleted.invalid`, name: null, phone: null, image: null, deletedAt: now() },
    });
    await audit({ actorUserId: null, action: "account.deleted", entity: "User", entityId: userId }, tx);
  });
}
