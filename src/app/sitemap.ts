import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/content/categories";
import { MUNICIPALITIES, PROVINCES } from "@/content/regions";
import { siteUrl, localePath } from "@/lib/site";

const PATHS = ["/", "/finders", "/bedrijven", "/hoe-het-werkt", "/categorieen", "/regio", "/faq", "/over-ons", "/contact", "/voorwaarden/finders", "/voorwaarden/bedrijven", "/privacy", "/cookies"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const all = [
    ...PATHS,
    ...CATEGORIES.map((c) => `/categorieen/${c.slug}`),
    ...PROVINCES.map((p) => `/regio/${p.key}`),
    ...MUNICIPALITIES.map((m) => `/regio/${m.province}/${m.slug}`),
  ];
  return all.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/categorieen/") || path.startsWith("/regio/") ? 0.6 : 0.8,
    alternates: { languages: { nl: `${base}${path === "/" ? "" : path}`, en: `${base}${localePath("en", path)}` } },
  }));
}
