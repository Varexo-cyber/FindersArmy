import { expect, test } from "@playwright/test";
import { login, signupLogin, unique } from "./helpers";

test("business signs up, admin approves, campaign goes live", async ({ page }) => {
  const email = `${unique("biz")}@example.com`;
  const name = `Schilderwerk ${unique("e2e")} (test)`;

  await signupLogin(page, email, "/aanmelden/bedrijf");

  // Step 1 — company
  await page.getByLabel("Bedrijfsnaam").fill(name);
  await page.getByLabel("KvK-nummer").fill("12345678");
  await page.getByLabel("Btw-nummer").fill("NL123456789B01");
  await page.locator("#street").fill("Teststraat");
  await page.getByLabel("Huisnummer").fill("12");
  await page.locator("#pc").fill("2671AB");
  await page.locator("#city").fill("Naaldwijk");
  await page.getByLabel("Contactpersoon").fill("Test Persoon");
  await page.locator("#phone").fill("0612345678");
  await page.locator("#desc").fill("Wij schilderen woningen in het Westland, binnen en buiten.");
  await page.getByRole("button", { name: "Volgende" }).click();

  // Step 2 — category and area
  await page.getByLabel("Categorie").selectOption({ label: "Schilders" });
  await page.locator("#area-city").fill("Naaldwijk");
  await page.getByRole("button", { name: "Volgende" }).click();

  // Step 3 — campaign and fee
  await page.getByLabel("Titel van je campagne").fill("Buitenschilderwerk Westland");
  await page.getByLabel("Wat voor klant zoek je?").fill("Huiseigenaren in Westland");
  await page.locator("#c-desc").fill("Kozijnen, dakgoten en gevels schilderen.");
  await page.locator("#c-region").fill("Westland");
  await expect(page.getByText(/Bij een klus van/)).toBeVisible();
  await page.getByRole("button", { name: "Volgende" }).click();

  // Step 4 — extras (skip), step 5 — terms
  await page.getByRole("button", { name: "Volgende" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Aanmelding versturen" }).click();

  await expect(page).toHaveURL(/app\/bedrijf/);
  await expect(page.getByText("Je aanmelding is binnen.")).toBeVisible();

  // Admin approves
  await login(page, "admin@findersarmy.test", "/admin/bedrijven");
  await page.goto("/admin/bedrijven?status=PENDING_REVIEW");
  await page.getByRole("link", { name }).click();
  await page.getByRole("button", { name: "Goedkeuren" }).click();
  await expect(page.getByText("ACTIVE").first()).toBeVisible();
  await expect(page.getByText("LIVE").first()).toBeVisible();
});
