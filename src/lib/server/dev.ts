import "server-only";

/** The dev mailbox and fake checkout exist only outside production, or in the e2e build. */
export function devMailboxEnabled(): boolean {
  if (process.env.RESEND_API_KEY) return false;
  return process.env.NODE_ENV !== "production" || process.env.E2E === "1";
}
