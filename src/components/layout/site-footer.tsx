import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Logo } from "@/components/brand/logo";
import { COMPANY } from "@/content/company";
import { formatIban } from "@/lib/iban";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");
  const cols = [
    {
      title: t("product"),
      links: [
        { href: "/finders", label: nav("finders") },
        { href: "/bedrijven", label: nav("business") },
        { href: "/hoe-het-werkt", label: nav("how") },
        { href: "/categorieen", label: nav("categories") },
        { href: "/aanmelden/bedrijf", label: t("signupBusiness") },
      ],
    },
    {
      title: t("company"),
      links: [
        { href: "/over-ons", label: t("about") },
        { href: "/contact", label: t("contact") },
        { href: "/faq", label: nav("faq") },
      ],
    },
    {
      title: t("legal"),
      links: [
        { href: "/voorwaarden/finders", label: t("termsFinders") },
        { href: "/voorwaarden/bedrijven", label: t("termsBusiness") },
        { href: "/privacy", label: t("privacy") },
        { href: "/cookies", label: t("cookies") },
      ],
    },
  ];
  return (
    <footer className="mt-24 border-t border-border">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-xs font-display text-xl font-semibold tracking-tight">{t("tagline")}</p>
          <p className="max-w-xs text-sm text-subtle">{t("noPyramid")}</p>
        </div>
        {cols.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="eyebrow mb-4">{col.title}</p>
            <ul className="flex flex-col gap-2.5">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-subtle transition-colors duration-150 hover:text-fg">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-subtle md:flex-row md:justify-between">
          <span className="font-mono">© {new Date().getFullYear()} {t("rights")}</span>
          <dl className="flex flex-wrap gap-x-4 gap-y-1 font-mono">
            <div className="flex gap-1.5"><dt>KvK</dt><dd>{COMPANY.kvk}</dd></div>
            <div className="flex gap-1.5"><dt>{t("vat")}</dt><dd>{COMPANY.vatNumber}</dd></div>
            <div className="flex gap-1.5"><dt>IBAN</dt><dd>{formatIban(COMPANY.iban)}</dd></div>
          </dl>
        </div>
      </div>
    </footer>
  );
}
