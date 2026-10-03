export function siteUrl(): string {
  return process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function localePath(locale: string, path: string): string {
  if (locale === "nl") return path;
  return path === "/" ? "/en" : `/en${path}`;
}
