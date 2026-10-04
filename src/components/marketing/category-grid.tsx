import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Money } from "@/components/ui/money";
import { CATEGORIES, CATEGORY_GROUPS } from "@/content/categories";
import { categoryExample } from "@/lib/examples";

/**
 * Every category, grouped by sector with jump chips. Used by /categorieen and /finders so the two
 * pages can never disagree about what a tip is worth.
 */
export function CategoryGrid({
  locale,
  earnLabel,
  liveLabel,
  counts = {},
}: {
  locale: "nl" | "en";
  earnLabel: string;
  liveLabel?: string;
  counts?: Record<string, number>;
}) {
  const groups = CATEGORY_GROUPS.map((g) => ({ ...g, items: CATEGORIES.filter((c) => c.group === g.key) })).filter((g) => g.items.length);
  return (
    <div className="flex flex-col gap-12">
      <nav aria-label={locale === "en" ? "Sectors" : "Sectoren"} className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <a key={g.key} href={`#sector-${g.key}`} data-spot className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm transition-colors duration-150 hover:border-fg">
            {locale === "en" ? g.en : g.nl} <span className="font-mono text-xs text-subtle">{g.items.length}</span>
          </a>
        ))}
      </nav>
      {groups.map((g) => (
        <section key={g.key} id={`sector-${g.key}`} className="scroll-mt-24 flex flex-col gap-5">
          <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
            <h2 className="text-2xl md:text-3xl">{locale === "en" ? g.en : g.nl}</h2>
            <span className="font-mono text-xs text-subtle">{g.items.length}</span>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((c) => {
              const ex = categoryExample(c);
              const live = counts[c.slug] ?? 0;
              return (
                <li key={c.slug} data-reveal>
                  <Link
                    href={`/categorieen/${c.slug}`}
                    data-spot
                    data-tilt
                    className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-bg p-5 transition-colors duration-150 hover:border-fg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-display text-lg font-semibold tracking-tight">{locale === "en" ? c.nameEn : c.nameNl}</h3>
                      <ArrowUpRight aria-hidden className="size-4 shrink-0 text-subtle transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-fg" />
                    </div>
                    <p className="line-clamp-2 text-sm text-subtle">{locale === "en" ? c.descriptionEn : c.descriptionNl}</p>
                    <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                      <div className="flex flex-col">
                        <span className="eyebrow">{earnLabel}</span>
                        <Money cents={ex.finderCents} short size="lg" highlight locale={locale} />
                      </div>
                      {live > 0 && liveLabel ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-subtle">
                          <span aria-hidden className="fx-pulse-dot size-1.5 rounded-full bg-signal" />
                          {live} {liveLabel}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
