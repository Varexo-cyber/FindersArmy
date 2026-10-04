import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/content/categories";
import { TIP_TILES } from "@/content/photos";
import { categoryExample } from "@/lib/examples";
import { formatEuroShort } from "@/lib/money";

/**
 * Featured categories as large photo cards: the category, a typical deal and what a Recruit takes
 * home. Laid out as a swipeable row; with `pinned` the row scrolls sideways while the page scrolls
 * down on desktop (public/motion.js, [data-hscroll]).
 */
export async function CategoryTiles({ locale, limit = TIP_TILES.length, header, pinned = false }: { locale: "nl" | "en"; limit?: number; header?: React.ReactNode; pinned?: boolean }) {
  const t = await getTranslations("home");
  const cards = TIP_TILES.slice(0, limit).map((tile, i) => {
    const c = CATEGORIES.find((x) => x.slug === tile.slug)!;
    const ex = categoryExample(c);
    return (
      <li key={tile.slug} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[380px]">
        <Link
          href={`/categorieen/${tile.slug}`}
          data-cursor={locale === "en" ? "View" : "Bekijk"}
          className="photo-zoom group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-[28px] bg-ink p-6 text-paper lg:aspect-auto lg:h-[min(68vh,560px)]"
        >
          <Image src={tile.photo.src} alt={tile.photo.alt[locale]} fill sizes="(min-width: 1024px) 380px, 78vw" className="object-cover" />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/0 to-black/85" />
          <div className="relative flex items-start justify-between gap-3">
            <span className="money text-sm text-white/70">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-colors group-hover:bg-signal group-hover:text-ink">
              <ArrowUpRight aria-hidden className="size-4" />
            </span>
          </div>
          <div className="relative flex flex-col gap-2">
            <h3 className="font-display text-3xl font-semibold tracking-tight">{locale === "en" ? c.nameEn : c.nameNl}</h3>
            <div className="flex items-end justify-between gap-3 border-t border-white/20 pt-3">
              <span className="text-sm text-white/75">{t("tileDeal", { amount: formatEuroShort(ex.jobCents, locale) })}</span>
              <span className="flex flex-col items-end">
                <span className="text-xs text-white/75">{t("tilesYou")}</span>
                <span className="money text-4xl font-semibold text-signal">{formatEuroShort(ex.finderCents, locale)}</span>
              </span>
            </div>
          </div>
        </Link>
      </li>
    );
  });

  if (!pinned) {
    return <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">{cards}</ul>;
  }
  return (
    <section data-hscroll className="py-16 lg:py-0">
      <div data-hscroll-sticky>
        <div className="container-x mb-10">{header}</div>
        <div className="overflow-x-auto lg:overflow-visible">
          <ul
            data-hscroll-track
            className="flex snap-x snap-mandatory gap-5 px-4 pb-2 md:px-8 lg:snap-none lg:pr-24 lg:pl-[max(2rem,calc((100vw-1200px)/2+2rem))]"
          >
            {cards}
          </ul>
        </div>
      </div>
    </section>
  );
}
