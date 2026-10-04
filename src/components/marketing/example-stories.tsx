import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CATEGORIES } from "@/content/categories";
import { PHOTOS, type Photo } from "@/content/photos";
import { categoryExample } from "@/lib/examples";
import { formatCents } from "@/lib/money";

/**
 * Example Finder profiles: realistic, and labelled as examples on every card. Amounts come from
 * the same worked examples as the rest of the site. Replace with real stories (with consent)
 * once there are any; presenting invented people as real users would be misleading advertising.
 */
const STORIES: { name: string; age: number; city: string; photo: Photo; deals: { slug: string; days: number }[] }[] = [
  { name: "Yassin", age: 19, city: "Rotterdam", photo: PHOTOS.jongenLacht, deals: [{ slug: "autodealers", days: 9 }, { slug: "rijscholen", days: 4 }] },
  { name: "Sanne", age: 23, city: "Utrecht", photo: PHOTOS.meisjeLacht, deals: [{ slug: "keukens", days: 21 }, { slug: "trouwlocaties", days: 30 }] },
  { name: "Daan", age: 27, city: "Eindhoven", photo: PHOTOS.vriendenTafel, deals: [{ slug: "zonnepanelen", days: 14 }, { slug: "badkamers", days: 18 }, { slug: "schilders", days: 7 }] },
];

export async function ExampleStories({ locale }: { locale: "nl" | "en" }) {
  const t = await getTranslations("home");
  return (
    <section className="py-16 md:py-24">
      <div className="container-x flex flex-col gap-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <h2 className="text-4xl md:text-6xl">{t("storiesTitle")}</h2>
          <p className="text-lg text-subtle">{t("storiesSub")}</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-3">
          {STORIES.map((s) => {
            const rows = s.deals.map((d) => {
              const c = CATEGORIES.find((x) => x.slug === d.slug)!;
              return { name: locale === "en" ? c.nameEn : c.nameNl, cents: categoryExample(c).finderCents, days: d.days };
            });
            const total = rows.reduce((sum, r) => sum + r.cents, 0);
            return (
              <li key={s.name} className="flex flex-col overflow-hidden rounded-[28px] border border-border bg-surface">
                <div className="relative aspect-[5/4]">
                  <Image src={s.photo.src} alt="" fill sizes="(min-width: 768px) 33vw, 92vw" className="object-cover" />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">{t("storiesLabel")}</span>
                  <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-3 text-white">
                    <p className="font-display text-2xl font-semibold tracking-tight">
                      {s.name}, {s.age}
                      <span className="block text-sm font-normal text-white/80">{s.city}</span>
                    </p>
                    <p className="text-right">
                      <span className="block text-xs text-white/80">{t("storiesTotal")}</span>
                      <span className="money text-3xl font-semibold text-signal">{formatCents(total, locale)}</span>
                    </p>
                  </div>
                </div>
                <ol className="flex flex-col gap-3 p-5">
                  {rows.map((r) => (
                    <li key={r.name} className="flex items-center gap-3 text-sm">
                      <span aria-hidden className="size-2 shrink-0 rounded-full bg-signal ring-4 ring-signal/20" />
                      <span className="flex-1">
                        <span className="font-medium">{r.name}</span>
                        <span className="block text-xs text-subtle">{t("storiesPaidAfter", { days: r.days })}</span>
                      </span>
                      <span className="money font-semibold">+ {formatCents(r.cents, locale)}</span>
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-subtle">{t("storiesNote")}</p>
      </div>
    </section>
  );
}
