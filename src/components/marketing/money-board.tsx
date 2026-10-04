import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { buttonVariants } from "@/components/ui/button";
import { CATEGORIES } from "@/content/categories";
import { PHOTOS, TIP_TILES, type Photo } from "@/content/photos";
import { categoryExample } from "@/lib/examples";
import { formatEuroShort } from "@/lib/money";
import { cn } from "@/lib/utils";

const ITEMS: { slug: string; photo: Photo }[] = [
  ...TIP_TILES,
  { slug: "aannemers", photo: PHOTOS.bouw },
  { slug: "interieurbouw", photo: PHOTOS.interieur },
];

/**
 * "Someone needs something, you earn": a board of categories with what one deal pays you. Hover
 * (or focus) a row and the big panel shows it; on its own it cycles slowly (public/motion.js,
 * [data-board]). Without JavaScript it is a plain list of links with the first panel visible.
 */
export async function MoneyBoard({ locale }: { locale: "nl" | "en" }) {
  const t = await getTranslations("home");
  const rows = ITEMS.map((it) => {
    const c = CATEGORIES.find((x) => x.slug === it.slug)!;
    const ex = categoryExample(c);
    // Marketing shows whole euros; the exact amount is on the campaign.
    const whole = (cents: number) => Math.round(cents / 100) * 100;
    return { ...it, name: locale === "en" ? c.nameEn : c.nameNl, job: ex.jobCents, fee: whole(ex.feeCents), you: whole(ex.finderCents) };
  });
  return (
    <section className="bg-ink py-16 text-paper md:py-24 [--fg:var(--paper)] [--subtle:#a9aca2] [--border:#2b2e27]">
      <div className="container-x flex flex-col gap-10">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-4xl md:text-6xl">{t("tilesTitle")}</h2>
            <p className="text-lg text-[#a9aca2]">{t("tilesSub")}</p>
          </div>
          <Link href="/categorieen" className={cn(buttonVariants({ variant: "outline" }), "border-white/20 text-paper hover:bg-white/10")}>
            {t("categoriesAll")} <ArrowRight aria-hidden />
          </Link>
        </div>

        <div data-board className="grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <ul className="flex flex-col">
            {rows.map((r, i) => (
              <li key={r.slug}>
                <Link
                  href={`/categorieen/${r.slug}`}
                  data-board-row={i}
                  className={cn(
                    "fa-row group relative flex items-center gap-4 border-b border-white/10 py-4 pl-4 transition-colors duration-300 md:py-5",
                    i === 0 && "is-active",
                  )}
                >
                  <span aria-hidden className="fa-row-bar absolute top-1/2 left-0 h-0 w-1 -translate-y-1/2 rounded-full bg-signal transition-all duration-300" />
                  <span className="money w-7 text-sm text-white/40">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">
                    <span className="block font-display text-xl font-semibold tracking-tight md:text-2xl">{r.name}</span>
                    <span className="block text-sm text-white/50">{t("tileDeal", { amount: formatEuroShort(r.job, locale) })}</span>
                  </span>
                  <span className="money text-2xl font-semibold whitespace-nowrap md:text-3xl">{formatEuroShort(r.you, locale)}</span>
                  <ArrowUpRight aria-hidden className="size-5 text-white/40 transition-transform duration-300 group-hover:rotate-45 group-hover:text-signal" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[32px] lg:sticky lg:top-24 lg:block" aria-hidden>
            {rows.map((r, i) => (
              <div key={r.slug} data-board-panel={i} className={cn("fa-panel absolute inset-0", i === 0 && "is-active")}>
                <Image src={r.photo.src} alt="" fill sizes="(min-width: 1024px) 560px, 0px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
                <div className="absolute inset-x-8 bottom-8 flex flex-col gap-4">
                  <p className="font-display text-3xl font-semibold tracking-tight">{r.name}</p>
                  <div className="flex items-end justify-between gap-6">
                    <div>
                      <p className="text-sm text-white/70">{t("tilesYou")}</p>
                      <p className="money text-7xl leading-none font-semibold tracking-tighter whitespace-nowrap text-signal xl:text-8xl">{formatEuroShort(r.you, locale)}</p>
                    </div>
                    <dl className="text-right text-sm text-white/70">
                      <dt>{t("boardFee")}</dt>
                      <dd className="money text-lg text-white">{formatEuroShort(r.fee, locale)}</dd>
                    </dl>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-signal" style={{ width: `${Math.round((r.you / r.fee) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-white/60">{t("boardShare", { pct: Math.round((r.you / r.fee) * 100) })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
