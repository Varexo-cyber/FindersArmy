import { defineRouting } from "next-intl/routing";

export const locales = ["nl", "en"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "nl",
  // Dutch lives at the root, English under /en. No accept-language guessing: Dutch is the
  // product's home market and a Dutch visitor on an English browser should still land in Dutch.
  localePrefix: "as-needed",
  localeDetection: false,
});
