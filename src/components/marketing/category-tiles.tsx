import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/content/categories";
import { TIP_TILES } from "@/content/photos";
import { categoryExample } from "@/lib/examples";
import { formatEuroShort } from "@/lib/money";

/** Photo tiles: the category, the size of a typical deal, and what a Recruit takes home. */
export async function CategoryTiles({ locale, limit = TIP_TILES.length }: { locale: "nl" | "en"; limit?: number }) {
  const t = await getTranslations("home");
  return (
    <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
      {TIP_TILES.slice(0, limit).map((tile) => {
        const c = CATEGORIES.find((x) => x.slug === tile.slug)!;
        const ex = categoryExample(c);
        return (
          <li key={tile.slug} className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-auto">
            <Link href={`/categorieen/${tile.slug}`} data-spot className="photo-zoom group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image src={tile.photo.src} alt={tile.photo.alt[locale]} fill sizes="(min-width: 768px) 25vw, 72vw" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-lg font-semibold tracking-tight">{locale === "en" ? c.nameEn : c.nameNl}</h3>
                  <ArrowUpRight aria-hidden className="size-4 shrink-0 text-subtle transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 border-t border-border pt-3">
                  <span className="text-xs text-subtle">{t("tileDeal", { amount: formatEuroShort(ex.jobCents, locale) })}</span>
                  <span className="flex flex-col items-end">
                    <span className="text-[11px] text-subtle">{t("tilesYou")}</span>
                    <span className="money rounded-md bg-signal px-1.5 text-2xl font-semibold text-ink">{formatEuroShort(ex.finderCents, locale)}</span>
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
