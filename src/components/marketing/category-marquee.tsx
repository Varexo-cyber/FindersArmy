import { Link } from "@/i18n/navigation";
import { allCategoryExamples } from "@/lib/examples";
import { formatEuroShort } from "@/lib/money";

/** Endless band of categories with what a Recruit earns on a typical job (worked examples). */
export function CategoryMarquee({ locale, label }: { locale: string; label: string }) {
  const items = allCategoryExamples()
    .filter((e) => e.finderCents >= 10_000)
    .sort((a, b) => b.finderCents - a.finderCents);
  const half = Math.ceil(items.length / 2);
  const rows = [items.slice(0, half), items.slice(half)];
  return (
    <div className="fx-marquee-wrap flex flex-col gap-3 overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
      {rows.map((row, r) => (
        <div key={r} className="fx-marquee" style={r === 1 ? { animationDirection: "reverse", animationDuration: "75s" } : undefined}>
          {[...row, ...row].map((e, i) => (
            <Link
              key={`${e.category.slug}-${i}`}
              href={`/categorieen/${e.category.slug}`}
              tabIndex={i >= row.length ? -1 : undefined}
              aria-hidden={i >= row.length ? true : undefined}
              data-spot
              className="mr-3 inline-flex shrink-0 items-center gap-3 rounded-full border border-border bg-surface px-4 py-2.5 text-sm whitespace-nowrap transition-colors duration-150 hover:border-fg"
            >
              <span className="font-medium">{locale === "en" ? e.category.nameEn : e.category.nameNl}</span>
              <span className="text-subtle">{label}</span>
              <span className="money rounded-sm bg-signal px-1.5 font-semibold text-ink">{formatEuroShort(e.finderCents, locale)}</span>
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
