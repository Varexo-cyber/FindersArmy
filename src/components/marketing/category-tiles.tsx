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
          <li key={tile.slug} className="w-[74%] shrink-0 snap-start sm:w-[45%] md:w-auto">
            <Link href={`/categorieen/${tile.slug}`} className="photo-zoom group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-3xl bg-ink p-5 text-paper">
              <Image src={tile.photo.src} alt={tile.photo.alt[locale]} fill sizes="(min-width: 768px) 25vw, 74vw" className="object-cover" />
              <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/90" />
              <div className="relative flex items-start justify-between gap-3">
                <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-medium backdrop-blur">{locale === "en" ? c.nameEn : c.nameNl}</span>
                <ArrowUpRight aria-hidden className="size-5 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="relative flex flex-col gap-1">
                <p className="text-sm text-[#d6d8d0]">{t("tileDeal", { amount: formatEuroShort(ex.jobCents, locale) })}</p>
                <p className="money text-5xl font-semibold tracking-tight text-signal">{formatEuroShort(ex.finderCents, locale)}</p>
                <p className="text-sm text-[#d6d8d0]">{t("tilesYou")}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
