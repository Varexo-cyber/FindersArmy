import { expect, test } from "@playwright/test";
import { login, signupLogin, unique } from "./helpers";

test("admin bans an account: the person can no longer get in, and unbanning restores access", async ({ page }) => {
  const email = `${unique("ban")}@example.com`;
  await signupLogin(page, email, "/aanmelden/finder");

  await login(page, "admin@findersarmy.test", "/admin/gebruikers");
  await page.goto(`/admin/gebruikers?q=${encodeURIComponent(email)}`);
  await expect(page.getByText(email)).toBeVisible();
  await page.getByRole("button", { name: "Bannen" }).click();
  await page.getByLabel("Reden van ban (intern)").fill("e2e: spam");
  await page.getByRole("button", { name: /bevestig|bannen/i }).last().click();
  await expect(page.getByText("Geband", { exact: true })).toBeVisible();

  // The banned person asks for a login link: no session comes out of it.
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByLabel(/e-mailadres/i).fill(email);
  await page.getByRole("button", { name: /inloglink/i }).click();
  await page.waitForTimeout(1500);
  await page.goto("/app");
  await expect(page).toHaveURL(/login/);

  await login(page, "admin@findersarmy.test", "/admin/gebruikers");
  await page.goto(`/admin/gebruikers?q=${encodeURIComponent(email)}`);
  await page.getByRole("button", { name: "Ban opheffen" }).click();
  await page.getByLabel("Reden").fill("e2e: vergissing");
  await page.getByRole("button", { name: /bevestig|ban opheffen/i }).last().click();
  await expect(page.getByText("Actief", { exact: true })).toBeVisible();

  await login(page, email, "/app");
  await expect(page).not.toHaveURL(/login/);
});
