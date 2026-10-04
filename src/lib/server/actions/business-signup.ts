"use server";

import { isBanned } from "../bans";
import { TERMS_VERSION } from "@/content/legal/version";
import { businessSignupSchema } from "@/lib/validation/business";
import { flattenErrors, type FieldErrors } from "@/lib/validation/common";
import { db } from "../db";
import { currentUser } from "../session";
import { storeImage } from "../storage";
import { notifyAdmins } from "../notify";
import { audit } from "../audit";
import { rateLimit } from "../rate-limit";
import { now } from "../clock";

export type BusinessSignupResult = { ok: true } | { ok: false; errors: FieldErrors; formError?: string };

export async function registerBusiness(formData: FormData): Promise<BusinessSignupResult> {
  const user = await currentUser();
  if (!user) return { ok: false, errors: {}, formError: "UNAUTHENTICATED" };
  if (user.memberships.length > 0) return { ok: false, errors: {}, formError: "ALREADY_REGISTERED" };
  const limited = await rateLimit("business-signup", user.id, 5, "1 h");
  if (!limited.ok) return { ok: false, errors: {}, formError: "RATE_LIMIT" };

  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { ok: false, errors: {}, formError: "INVALID" };
  }
  const parsed = businessSignupSchema.safeParse(payload);
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };
  const data = parsed.data;

  if ((await isBanned("KVK", data.company.kvk)) || (await isBanned("EMAIL", user.email))) {
    return { ok: false, errors: {}, formError: "BANNED" };
  }

  const category = await db.category.findUnique({ where: { id: data.categoryId } });
  if (!category || category.excluded) return { ok: false, errors: { categoryId: "required" } };

  let logoUrl: string | undefined;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoUrl = await storeImage(logo, "logos", true);
    } catch {
      return { ok: false, errors: { logo: "FILE" } };
    }
  }

  const t = now();
  const business = await db.$transaction(async (tx) => {
    const b = await tx.business.create({
      data: {
        ...data.company,
        logoUrl,
        offerUrl: data.campaign.offerUrl,
        categoryId: category.id,
        serviceArea: data.serviceArea,
        termsAcceptedAt: t,
        termsVersion: TERMS_VERSION,
        members: { create: { userId: user.id, role: "OWNER" } },
      },
    });
    const { offerUrl: _offer, ...campaign } = data.campaign;
    void _offer;
    await tx.campaign.create({
      data: {
        businessId: b.id,
        title: campaign.title,
        description: campaign.description,
        targetCustomer: campaign.targetCustomer,
        region: campaign.region,
        feeType: campaign.feeType,
        feePercentBps: campaign.feePercentBps,
        feeFixedCents: campaign.feeFixedCents,
        tiers: campaign.tiers ?? undefined,
        minJobAmountCents: campaign.minJobAmountCents,
        minFeeCents: campaign.minFeeCents,
        monthlyBudgetCents: campaign.monthlyBudgetCents,
        status: "DRAFT",
      },
    });
    await tx.user.update({
      where: { id: user.id },
      data: { roles: { set: Array.from(new Set([...user.roles, "BUSINESS" as const])) }, name: user.name ?? data.company.contactName, phone: user.phone ?? data.company.phone },
    });
    await audit({ actorUserId: user.id, action: "business.registered", entity: "Business", entityId: b.id }, tx);
    return b;
  });

  await notifyAdmins("ADMIN_NEW_BUSINESS", { business: business.name, category: category.nameNl }, `/admin/bedrijven/${business.id}`);
  return { ok: true };
}
