import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CATEGORIES } from "@/content/categories";
import { TIP_TILES } from "@/content/photos";
import { categoryExample } from "@/lib/examples";
import { formatCents, formatEuroShort } from "@/lib/money";

/**
 * The Finder app as it looks on a phone, built from the same worked examples as the rest of the
 * site and labelled as an example: no invented balances, no invented users.
 */
export async function PhoneMockup({ locale }: { locale: "nl" | "en" }) {
  const t = await getTranslations("home");
  const rows = TIP_TILES.slice(0, 3).map((tile) => {
    const c = CATEGORIES.find((x) => x.slug === tile.slug)!;
    return { tile, name: locale === "en" ? c.nameEn : c.nameNl, cents: categoryExample(c).finderCents };
  });
  const total = rows.reduce((s, r) => s + r.cents, 0);
  return (
    <div className="relative mx-auto w-[300px] md:w-[330px]">
      <div className="rounded-[46px] border border-white/15 bg-[#0b0c0a] p-2.5 shadow-[0_40px_120px_-30px_rgb(212_255_63/0.35)]">
        <div className="relative overflow-hidden rounded-[38px] bg-[#f5f3ee] text-ink">
          <div className="mx-auto mt-2.5 h-6 w-28 rounded-full bg-[#0b0c0a]" aria-hidden />
          <div className="flex flex-col gap-4 px-5 pt-4 pb-6">
            <div className="flex items-center justify-between text-xs text-[#6b6e66]">
              <span>{t("phoneHello")}</span>
              <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] text-paper">{t("phoneExample")}</span>
            </div>
            <div className="rounded-3xl bg-ink p-5 text-paper">
              <p className="text-xs text-[#a9aca2]">{t("phoneBalance")}</p>
              <p className="money mt-1 text-4xl font-semibold">{formatCents(total, locale)}</p>
              <div className="mt-4 flex gap-2">
                <span className="flex-1 rounded-full bg-signal py-2 text-center text-xs font-semibold text-ink">{t("phonePayout")}</span>
                <span className="flex-1 rounded-full border border-white/20 py-2 text-center text-xs">{t("phoneShare")}</span>
              </div>
            </div>
            <p className="text-xs font-medium text-[#6b6e66]">{t("phoneRecent")}</p>
            <ul className="flex flex-col gap-2.5">
              {rows.map((r) => (
                <li key={r.tile.slug} className="flex items-center gap-3">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-xl">
                    <Image src={r.tile.photo.src} alt="" fill sizes="40px" className="object-cover" />
                  </span>
                  <span className="flex-1 text-sm">
                    <span className="block font-medium">{r.name}</span>
                    <span className="block text-xs text-[#6b6e66]">{t("phoneWon")}</span>
                  </span>
                  <span className="money text-sm font-semibold">+{formatEuroShort(r.cents, locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* The moment it is all about, on a loop. */}
      <div className="fa-toast absolute -left-6 bottom-6 flex items-center gap-3 rounded-2xl bg-[#1c1e19]/95 px-4 py-3 text-paper shadow-2xl ring-1 ring-white/10 backdrop-blur md:-left-16">
        <span className="flex size-9 items-center justify-center rounded-full bg-signal font-bold text-ink">€</span>
        <span className="text-sm">
          <span className="block text-xs text-[#a9aca2]">{t("toastTitle")}</span>
          <span className="money block font-semibold">+ {formatCents(rows[1]!.cents, locale)}</span>
        </span>
      </div>
    </div>
  );
}
