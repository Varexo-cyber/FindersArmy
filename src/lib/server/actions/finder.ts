"use server";

import { isBanned } from "../bans";
import { TERMS_VERSION } from "@/content/legal/version";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { finderSignupSchema, finderProfileSchema } from "@/lib/validation/finder";
import { flattenErrors, type FieldErrors } from "@/lib/validation/common";
import { checkFinderAge } from "@/lib/age";
import { env, appUrl } from "@/lib/env";
import { db } from "../db";
import { currentUser, assertFinder } from "../session";
import { randomCode, randomToken, requestFingerprint } from "../hash";
import { rateLimit } from "../rate-limit";
import { now } from "../clock";
import { audit } from "../audit";
import { sendMail } from "../mailer";
import { notifyAdmins } from "../notify";
import { requestPayout, PayoutError } from "../services/payouts";
import { parseEuroToCents } from "../../money";

export type FinderResult = { ok: true; code?: string } | { ok: false; errors?: FieldErrors; error?: string };

async function uniqueCode(field: "inviteCode" | "code"): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = randomCode(field === "code" ? 7 : 8);
    const exists = field === "code" ? await db.referralLink.findUnique({ where: { code } }) : await db.finderProfile.findUnique({ where: { inviteCode: code } });
    if (!exists) return code;
  }
  throw new Error("Could not generate a unique code");
}

export async function registerFinder(raw: unknown): Promise<FinderResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "UNAUTHENTICATED" };
  if (user.finderProfile) return { ok: true };
  if (user.bannedAt || (await isBanned("EMAIL", user.email))) return { ok: false, error: "BANNED" };
  const parsed = finderSignupSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };
  const data = parsed.data;
  const birth = new Date(`${data.birthDate}T00:00:00Z`);
  const age = checkFinderAge(birth, now(), env().ALLOW_16_PLUS);
  if (age === "TOO_YOUNG") return { ok: false, errors: { birthDate: "underage" } };
  if (age === "NEEDS_PARENT" && !data.parentEmail) return { ok: false, errors: { parentEmail: "required" } };

  const inviteFrom = data.inviteCode ?? (await cookies()).get("fa_invite")?.value;
  const inviter = inviteFrom ? await db.finderProfile.findUnique({ where: { inviteCode: inviteFrom } }) : null;

  const profile = await db.$transaction(async (tx) => {
    const p = await tx.finderProfile.create({
      data: {
        userId: user.id,
        birthDate: birth,
        city: data.city,
        nickname: data.nickname,
        leaderboardOptIn: data.leaderboardOptIn && Boolean(data.nickname),
        inviteCode: await uniqueCode("inviteCode"),
        referredByFinderId: inviter && inviter.userId !== user.id ? inviter.id : null,
        termsAcceptedAt: now(),
        termsVersion: TERMS_VERSION,
        parentEmail: age === "NEEDS_PARENT" ? data.parentEmail : null,
      },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { name: data.name, phone: data.phone, roles: { set: Array.from(new Set([...user.roles, "FINDER" as const])) } },
    });
    await audit({ actorUserId: user.id, action: "finder.registered", entity: "FinderProfile", entityId: p.id }, tx);
    return p;
  });

  if (age === "NEEDS_PARENT" && data.parentEmail) {
    const token = randomToken();
    await db.setting.create({ data: { key: `parent-consent:${token}`, value: { finderId: profile.id } } });
    await sendMail({
      to: data.parentEmail,
      locale: "nl",
      subject: `${data.name} wil Finder worden bij FindersArmy`,
      block: {
        heading: "Toestemming gevraagd",
        paragraphs: [
          `${data.name} (16 of 17 jaar) wil zich aanmelden als Finder bij FindersArmy: klanten aanbrengen bij lokale bedrijven en daarvoor een vergoeding ontvangen.`,
          "Als ouder of voogd vragen we je toestemming. Uitbetalingen gaan alleen naar een rekening op naam van je kind.",
        ],
        cta: { label: "Ik geef toestemming", url: appUrl(`/api/consent/${token}`) },
        footnote: "Geen toestemming? Negeer deze e-mail; het account kan dan geen links delen.",
      },
    });
  }
  return { ok: true };
}

/** Get (or create) the Finder's personal link for a campaign. */
export async function ensureReferralLink(campaignId: string): Promise<FinderResult> {
  const { user, finder } = await assertFinder();
  if (finder.status === "SUSPENDED") return { ok: false, error: "SUSPENDED" };
  if (finder.parentEmail && !finder.parentConsentAt) return { ok: false, error: "PARENT_CONSENT" };
  const existing = await db.referralLink.findUnique({ where: { finderId_campaignId: { finderId: finder.id, campaignId } } });
  if (existing) return { ok: true, code: existing.code };
  const limited = await rateLimit("link-create", user.id, 30, "1 h");
  if (!limited.ok) return { ok: false, error: "RATE_LIMIT" };
  const campaign = await db.campaign.findUnique({ where: { id: campaignId }, include: { business: true } });
  if (!campaign || campaign.status !== "LIVE" || campaign.business.status !== "ACTIVE") return { ok: false, error: "UNAVAILABLE" };
  const link = await db.referralLink.create({ data: { code: await uniqueCode("code"), finderId: finder.id, campaignId } });
  return { ok: true, code: link.code };
}

export async function updateFinderProfile(raw: unknown): Promise<FinderResult> {
  const { user, finder } = await assertFinder();
  const parsed = finderProfileSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };
  const d = parsed.data;
  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { name: d.name, phone: d.phone, locale: d.locale ?? user.locale } });
    await tx.finderProfile.update({
      where: { id: finder.id },
      data: { city: d.city, nickname: d.nickname ?? null, leaderboardOptIn: d.leaderboardOptIn && Boolean(d.nickname), iban: d.iban ?? null, ibanHolder: d.ibanHolder ?? null },
    });
    // IBAN changes are security-relevant: audit them (masked).
    if ((d.iban ?? null) !== finder.iban) {
      await audit({ actorUserId: user.id, action: "finder.iban_changed", entity: "FinderProfile", entityId: finder.id, before: { iban: finder.iban?.slice(-4) ?? null }, after: { iban: d.iban?.slice(-4) ?? null } }, tx);
    }
  });
  revalidatePath("/app/finder", "layout");
  return { ok: true };
}

export async function requestMyPayout(amount: string): Promise<FinderResult> {
  const { finder } = await assertFinder();
  const cents = parseEuroToCents(amount);
  if (!cents) return { ok: false, error: "INVALID" };
  try {
    await requestPayout(finder.id, cents);
  } catch (e) {
    if (e instanceof PayoutError) return { ok: false, error: e.code };
    throw e;
  }
  revalidatePath("/app/finder/saldo");
  return { ok: true };
}

export async function reportCompletedJob(leadId: string, message: string): Promise<FinderResult> {
  const { user, finder } = await assertFinder();
  const text = message.trim();
  if (text.length < 10 || text.length > 1000) return { ok: false, error: "tooShort" };
  const lead = await db.lead.findFirst({ where: { id: leadId, finderId: finder.id }, include: { campaign: { include: { business: true } } } });
  if (!lead) return { ok: false, error: "FORBIDDEN" };
  const limited = await rateLimit("report", user.id, 10, "1 h");
  if (!limited.ok) return { ok: false, error: "RATE_LIMIT" };
  await db.report.create({ data: { leadId, finderId: finder.id, message: text } });
  await notifyAdmins("ADMIN_REPORT", { business: lead.campaign.business.name, message: text }, "/admin/geschillen");
  return { ok: true };
}

/** Record the device a Finder uses, hashed, so a "customer" on the same device is caught. */
export async function recordFinderDevice(finderId: string) {
  const { ipHash, uaHash } = await requestFingerprint();
  await db.finderDevice.upsert({
    where: { finderId_ipHash_uaHash: { finderId, ipHash, uaHash } },
    create: { finderId, ipHash, uaHash },
    update: { lastSeenAt: now() },
  });
}
