import { getTranslations, setRequestLocale } from "next-intl/server";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/app/app-shell";
import { CampaignCard } from "@/components/app/campaign-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import { requireFinder } from "@/lib/server/session";
import { getSettings } from "@/lib/server/settings";
import { discoverCampaigns } from "@/lib/server/services/campaigns";
import { db } from "@/lib/server/db";
import { rankFor } from "@/lib/ranks";

export default async function DiscoverPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ categorie?: string; regio?: string; sort?: string; welkom?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { finder } = await requireFinder();
  const t = await getTranslations("finderApp");
  const tc = await getTranslations("common");
  const sp = await searchParams;
  const settings = await getSettings();
  const share = rankFor(finder.paidDeals, settings.ranks).shareBps;
  const sort = sp.sort === "new" || sp.sort === "boost" ? sp.sort : "earning";
  const [rows, categories, anyLive] = await Promise.all([
    discoverCampaigns(share, { category: sp.categorie, region: sp.regio?.slice(0, 60), sort }),
    db.category.findMany({ where: { excluded: false }, orderBy: { sortOrder: "asc" } }),
    db.campaign.count({ where: { status: "LIVE", business: { status: "ACTIVE" } } }),
  ]);
  const filtered = Boolean(sp.categorie || sp.regio);

  return (
    <>
      <PageHeader title={t("discoverTitle")} sub={t("discoverSub")} />
      {finder.status === "WARNED" ? <Alert tone="warning" className="mb-6">{t("warned")}</Alert> : null}
      {finder.status === "SUSPENDED" ? <Alert tone="warning" className="mb-6">{t("suspended")}</Alert> : null}

      <form className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-[1fr_1fr_1fr_auto]" role="search">
        <label className="sr-only" htmlFor="f-cat">{t("filterCategory")}</label>
        <Select id="f-cat" name="categorie" defaultValue={sp.categorie ?? ""} className="h-10">
          <option value="">{t("filterCategory")}: {tc("all").toLowerCase()}</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{locale === "en" ? c.nameEn : c.nameNl}</option>)}
        </Select>
        <label className="sr-only" htmlFor="f-sort">{t("filterSort")}</label>
        <Select id="f-sort" name="sort" defaultValue={sort} className="h-10">
          <option value="earning">{t("sortEarning")}</option>
          <option value="boost">{t("sortBoost")}</option>
          <option value="new">{t("sortNew")}</option>
        </Select>
        <label className="sr-only" htmlFor="f-reg">{t("filterRegion")}</label>
        <Input id="f-reg" name="regio" defaultValue={sp.regio ?? ""} placeholder={t("filterRegion")} className="col-span-2 h-10 md:col-span-1" />
        <Button type="submit" variant="solid" className="col-span-2 h-10 md:col-span-1"><Search aria-hidden /> {tc("view")}</Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState
          icon={Search}
          title={anyLive === 0 ? t("noCampaignsAtAll") : t("noCampaigns")}
          action={filtered ? <Link href="/app/finder" className={buttonVariants({ variant: "outline" })}>{t("resetFilters")}</Link> : null}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <li key={r.campaign.id}>
              <CampaignCard
                id={r.campaign.id}
                business={r.business.name}
                logoUrl={r.business.logoUrl}
                category={locale === "en" ? r.category.nameEn : r.category.nameNl}
                region={r.campaign.region}
                earnCents={r.earnCents}
                boostLabel={r.boost?.label}
                locale={locale}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
