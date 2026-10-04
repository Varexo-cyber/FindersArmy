import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Globe, MapPin } from "lucide-react";
import { LeadForm } from "@/components/forms/lead-form";
import { db } from "@/lib/server/db";
import { requestFingerprint } from "@/lib/server/hash";
import { addDays, now } from "@/lib/server/clock";

export const dynamic = "force-dynamic";

async function load(code: string) {
  if (!/^[a-z0-9]{4,16}$/.test(code)) return null;
  return db.referralLink.findUnique({ where: { code }, include: { campaign: { include: { business: { include: { category: true } } } }, finder: { include: { user: true } } } });
}

export async function generateMetadata({ params }: { params: Promise<{ code: string; locale: string }> }): Promise<Metadata> {
  const { code, locale } = await params;
  const link = await load(code);
  const title = link ? link.campaign.business.name : "FindersArmy";
  return {
    title,
    description: link?.campaign.business.description.slice(0, 150),
    robots: { index: false, follow: false },
    openGraph: link ? { title, images: [{ url: `/api/og?title=${encodeURIComponent(locale === "en" ? `Recommended: ${title}` : `Aanrader: ${title}`)}&locale=${locale}` }] } : undefined,
  };
}

/** Only the first name is ever shown about a Finder, never their full name. */
function finderDisplayName(name: string | null | undefined, nickname: string | null) {
  return name?.trim().split(/\s+/)[0] || nickname || "Iemand die je kent";
}

export default async function ReferralPage({ params }: { params: Promise<{ code: string; locale: string }> }) {
  const { code, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("referral");
  const link = await load(code);
  if (!link) {
    return (
      <div className="container-x flex max-w-xl flex-col gap-3 py-20">
        <h1 className="text-4xl">{t("notFoundTitle")}</h1>
        <p className="text-subtle">{t("notFoundBody")}</p>
      </div>
    );
  }
  const { campaign, finder } = link;
  const business = campaign.business;
  const available = campaign.status === "LIVE" && business.status === "ACTIVE" && finder.status !== "SUSPENDED";

  // Count the click once per device per day; only hashes are stored.
  const { ipHash, uaHash } = await requestFingerprint();
  const seen = await db.click.findFirst({ where: { referralLinkId: link.id, ipHash, createdAt: { gte: addDays(now(), -1) } } });
  if (!seen) {
    await db.$transaction([
      db.click.create({ data: { referralLinkId: link.id, ipHash, userAgentHash: uaHash } }),
      db.referralLink.update({ where: { id: link.id }, data: { clicks: { increment: 1 } } }),
    ]);
  }
  const finderName = finderDisplayName(finder.user.name, finder.nickname);
  const area = business.serviceArea as { type: string; city?: string; km?: number };

  return (
    <div className="container-x grid gap-10 py-10 md:grid-cols-[1fr_1.1fr] md:py-16">
      <section className="flex flex-col gap-6">
        <p className="eyebrow">{locale === "en" ? business.category.nameEn : business.category.nameNl}</p>
        <h1 className="text-4xl leading-[1] md:text-5xl">
          {t.rich("recommends", { finder: finderName, business: business.name, b: (c) => <strong>{c}</strong> })}
        </h1>
        <p className="text-lg text-subtle">{t("recommendsSub", { finder: finderName })}</p>
        <div className="flex items-start gap-4 rounded-md border border-border bg-surface p-5">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt={`${business.name} logo`} width={64} height={64} className="size-16 shrink-0 rounded-md border border-border bg-bg object-contain" />
          ) : null}
          <div className="flex flex-col gap-2">
            <h2 className="text-xl">{t("about", { business: business.name })}</h2>
            <p className="text-sm whitespace-pre-line">{business.description}</p>
            <p className="font-medium">{campaign.title}</p>
            <ul className="flex flex-col gap-1 text-sm text-subtle">
              <li className="flex items-center gap-2"><MapPin aria-hidden className="size-4" /> {campaign.region}{area.type === "radius" ? ` · ${area.km} km rond ${area.city}` : ""}</li>
              {business.website ? <li className="flex items-center gap-2"><Globe aria-hidden className="size-4" /> <a href={business.website} target="_blank" rel="noreferrer" className="underline underline-offset-2">{business.website.replace(/^https?:\/\//, "")}</a></li> : null}
            </ul>
          </div>
        </div>
        <p className="text-xs text-subtle">{t("poweredBy")}</p>
      </section>
      <section className="rounded-md border border-border p-5 md:p-8">
        {available ? (
          <>
            <h2 className="mb-1 text-2xl">{t("formTitle")}</h2>
            <p className="mb-6 text-sm text-subtle">{t("formSub", { business: business.name })}</p>
            <LeadForm code={link.code} business={business.name} finder={finderName} />
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl">{t("unavailableTitle")}</h2>
            <p className="text-subtle">{t("unavailableBody")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
