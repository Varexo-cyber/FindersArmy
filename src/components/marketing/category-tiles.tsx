import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES } from "@/content/categories";
import { TIP_TILES } from "@/content/photos";
import { categoryExample } from "@/lib/examples";
import { formatEuroShort } from "@/lib/money";
import { cn } from "@/lib/utils";

/** Cards cycle through the brand colours so the row has rhythm without leaning on photos. */
const TONES = ["bg-signal text-ink", "bg-ink text-paper", "bg-surface text-fg ring-1 ring-border"];

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
      <li key={tile.slug} className="w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[360px]">
        <Link
          href={`/categorieen/${tile.slug}`}
          data-cursor={locale === "en" ? "View" : "Bekijk"}
          className={cn(
            "group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-[32px] p-6 transition-transform duration-500 ease-out-quick hover:-translate-y-1.5 lg:aspect-auto lg:h-[min(64vh,520px)]",
            TONES[i % TONES.length],
          )}
        >
          <div className="flex items-center gap-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-2xl">
              <Image src={tile.photo.src} alt="" fill sizes="56px" className="object-cover transition-transform duration-700 group-hover:scale-110" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-xl font-semibold tracking-tight">{locale === "en" ? c.nameEn : c.nameNl}</span>
              <span className="text-sm opacity-70">{t("tileDeal", { amount: formatEuroShort(ex.jobCents, locale) })}</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium opacity-70">{t("tilesYou")}</span>
            <span className="money text-[4.6rem] leading-[0.95] font-semibold tracking-[-0.06em] md:text-[5.4rem]">
              {formatEuroShort(ex.finderCents, locale).replace(/\s/g, "")}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-current/15 pt-4 text-sm font-medium">
            <span>{locale === "en" ? "Share your link" : "Deel je link"}</span>
            <span className="flex size-10 items-center justify-center rounded-full border border-current/25 transition-transform duration-300 group-hover:rotate-45">
              <ArrowUpRight aria-hidden className="size-4" />
            </span>
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
