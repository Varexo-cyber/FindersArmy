"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";

export function LocaleSwitch({ label, code }: { label: string; code: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const search = useSearchParams();
  const other = locale === "nl" ? "en" : "nl";
  const query = search.toString();
  return (
    <Link
      href={query ? `${pathname}?${query}` : pathname}
      locale={other}
      hrefLang={other}
      aria-label={label}
      title={label}
      className="inline-flex h-9 items-center rounded-md px-2 font-mono text-xs tracking-wider text-subtle transition-colors duration-150 hover:text-fg"
    >
      {code}
    </Link>
  );
}
