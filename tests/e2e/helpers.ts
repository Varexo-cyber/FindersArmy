import { expect, type Page } from "@playwright/test";

export const unique = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Read the latest dev-mailbox mail for an address and return the first link matching `match`. */
export async function mailLink(page: Page, to: string, match: RegExp | string, after?: number): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const res = await page.request.get(`/api/dev/mail?format=json&to=${encodeURIComponent(to)}`);
    const mails = (await res.json()) as { links: string[]; createdAt: string; subject: string }[];
    for (const m of mails) {
      if (after && new Date(m.createdAt).getTime() < after) continue;
      const link = m.links.find((l) => (typeof match === "string" ? l.includes(match) : match.test(l)));
      if (link) return link;
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`No mail with link ${match} for ${to}`);
}

export async function login(page: Page, email: string, next = "/app") {
  const started = Date.now() - 1000;
  await page.context().clearCookies();
  await page.goto(`/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel(/e-mailadres|email address/i).fill(email);
  await page.getByRole("button", { name: /inloglink|login link/i }).click();
  await expect(page).toHaveURL(/login\/check/);
  const link = await mailLink(page, email, "/api/auth/callback/email", started);
  await page.goto(link);
}

export async function signupLogin(page: Page, email: string, path: string) {
  const started = Date.now() - 1000;
  await page.context().clearCookies();
  await page.goto(path);
  await page.getByLabel(/e-mailadres|email address/i).fill(email);
  await page.getByRole("button", { name: /inloglink|login link/i }).click();
  await expect(page).toHaveURL(/login\/check/);
  await page.goto(await mailLink(page, email, "/api/auth/callback/email", started));
  await expect(page).toHaveURL(new RegExp(path));
}
