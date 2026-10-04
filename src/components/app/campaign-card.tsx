import { getTranslations } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/ui/money";

export async function CampaignCard({ id, business, logoUrl, category, region, earnCents, boostLabel, locale }: { id: string; business: string; logoUrl: string | null; category: string; region: string; earnCents: number; boostLabel?: string | null; locale: string }) {
  const t = await getTranslations("common");
  return (
    <Link href={`/app/finder/campagne/${id}`} data-spot data-tilt className="group flex h-full flex-col gap-4 rounded-lg border border-border bg-surface p-5 transition-colors duration-150 hover:border-fg">
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow truncate">{category}</span>
        {boostLabel ? <Badge tone="signal">{boostLabel}</Badge> : null}
      </div>
      <div>
        <p className="text-sm text-subtle">{t("earnUpTo")}</p>
        <Money cents={earnCents} short size="xl" highlight locale={locale} />
      </div>
      <div className="mt-auto flex items-center gap-3 border-t border-border pt-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" width={36} height={36} className="size-9 rounded-sm border border-border bg-bg object-contain" />
        ) : (
          <span aria-hidden className="flex size-9 items-center justify-center rounded-sm border border-border font-display text-sm font-bold">{business.slice(0, 1)}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold tracking-tight">{business}</p>
          <p className="truncate text-sm text-subtle">{region}</p>
        </div>
        <ArrowUpRight aria-hidden className="size-4 text-subtle transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
