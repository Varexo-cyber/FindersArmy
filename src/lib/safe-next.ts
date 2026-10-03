/** Only allow same-site relative redirects after login (no //evil.com, no backslash tricks). */
export function safeNext(next: string | undefined | null, fallback: string): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
