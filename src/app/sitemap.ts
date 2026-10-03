import type { MetadataRoute } from "next";
import { CATEGORIES } from "@/content/categories";
import { siteUrl, localePath } from "@/lib/site";

const PATHS = ["/", "/finders", "/bedrijven", "/hoe-het-werkt", "/categorieen", "/faq", "/over-ons", "/contact", "/voorwaarden/finders", "/voorwaarden/bedrijven", "/privacy", "/cookies"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const all = [...PATHS, ...CATEGORIES.map((c) => `/categorieen/${c.slug}`)];
  return all.map((path) => ({
    url: `${base}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/categorieen/") ? 0.6 : 0.8,
    alternates: { languages: { nl: `${base}${path === "/" ? "" : path}`, en: `${base}${localePath("en", path)}` } },
  }));
}
