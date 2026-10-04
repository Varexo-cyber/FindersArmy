import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConfirmForm } from "@/components/forms/confirm-form";
import { db } from "@/lib/server/db";
import { getSettings } from "@/lib/server/settings";
import { formatCents } from "@/lib/money";

export const metadata: Metadata = { title: "Bevestig je klus", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ConfirmPage({ params }: { params: Promise<{ token: string; locale: string }> }) {
  const { token, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("confirm");
  const confirmation = token.length >= 20 ? await db.confirmation.findUnique({ where: { token }, include: { lead: { include: { campaign: { include: { business: true } } } } } }) : null;
  const usable = confirmation && !["LOST", "FRAUD", "DUPLICATE"].includes(confirmation.lead.status);
  if (!usable) {
    return (
      <div className="container-x flex max-w-xl flex-col gap-3 py-20">
        <h1 className="text-4xl">{t("invalidTitle")}</h1>
        <p className="text-subtle">{t("invalidBody")}</p>
      </div>
    );
  }
  const settings = await getSettings();
  const business = confirmation.lead.campaign.business.name;
  const answered = Boolean(confirmation.confirmedAt || confirmation.disagreed);
  return (
    <div className="container-x flex max-w-xl flex-col gap-6 py-14">
      <p className="eyebrow">FindersArmy</p>
      <h1 className="text-4xl leading-[1] md:text-5xl">{answered ? t("alreadyTitle") : t("title", { business })}</h1>
      {answered ? (
        <p className="text-subtle">{t("alreadyBody")}</p>
      ) : (
        <>
          <p className="text-lg text-subtle">{t("sub", { business, amount: formatCents(confirmation.lead.dealAmountCents ?? 0, locale) })}</p>
          <ConfirmForm token={token} bonusCents={settings.customerBonusCents} />
        </>
      )}
    </div>
  );
}
