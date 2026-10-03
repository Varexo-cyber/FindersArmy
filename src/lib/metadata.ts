import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { localePath } from "./site";

type MetaKey = "finders" | "business" | "how" | "categories" | "faq" | "about" | "contact";

/** Per-page metadata: title, description, canonical + hreflang, and a generated OG image. */
export async function pageMetadata(locale: string, key: MetaKey | null, path: string, override?: { title?: string; description?: string }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  const title = override?.title ?? (key ? t(key) : t("defaultTitle"));
  const descKey = key ? (`${key}Description` as const) : "defaultDescription";
  const description = override?.description ?? t(descKey as "defaultDescription");
  const og = `/api/og?title=${encodeURIComponent(title)}&locale=${locale}`;
  return {
    title,
    description,
    alternates: { canonical: localePath(locale, path), languages: { nl: path, en: localePath("en", path) } },
    openGraph: { title, description, url: localePath(locale, path), images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}
