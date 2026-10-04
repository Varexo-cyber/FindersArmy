import { expect, test } from "@playwright/test";
import { login, mailLink, signupLogin, unique } from "./helpers";

/**
 * Flows 4 and 5 end to end:
 *  deal won with amount → customer confirms → invoice → (fake) Mollie payment → webhook →
 *  Finder balance available → payout request → admin approves → SEPA batch → paid out.
 */
test.describe.serial("deal → invoice → payment → payout", () => {
  const finderEmail = `${unique("finder")}@example.com`;
  const customerEmail = `${unique("klant")}@example.com`;
  const customerLast = unique("Klant");
  let referralPath = "";

  test("setup: finder shares, customer requests", async ({ page, browser, baseURL }) => {
    await signupLogin(page, finderEmail, "/aanmelden/finder");
    await page.getByLabel("Volledige naam").fill("Fien Finder");
    await page.getByLabel("Geboortedatum").fill("1995-02-02");
    await page.getByLabel("Woonplaats").fill("Delft");
    await page.getByLabel("Telefoonnummer").fill("0612121212");
    await page.getByRole("checkbox", { name: /voorwaarden/ }).check();
    await page.getByRole("button", { name: "Account afmaken" }).click();
    await page.getByRole("link", { name: /Schildersbedrijf Kwast/ }).first().click();
    await page.getByRole("button", { name: "Deel je link" }).click();
    referralPath = new URL((await page.getByTestId("referral-url").textContent())!.trim()).pathname;

    const ctx = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "198.51.100.23" } });
    const c = await ctx.newPage();
    await c.goto(`${baseURL}${referralPath}`);
    await c.getByLabel("Voornaam").fill("Sanne");
    await c.getByLabel("Achternaam").fill(customerLast);
    await c.getByLabel("Telefoonnummer").fill(`06${String(Date.now()).slice(-8)}`);
    await c.getByLabel("E-mailadres").fill(customerEmail);
    await c.getByLabel("Postcode").fill("2611 AB");
    await c.getByLabel("Huisnummer").fill("3");
    await c.getByLabel("Wat heb je nodig?").fill("Complete woning buiten schilderen, twee verdiepingen.");
    await c.getByRole("checkbox", { name: /toestemming/ }).check();
    await c.getByRole("button", { name: "Verstuur aanvraag" }).click();
    await expect(c.getByRole("heading", { name: "Je aanvraag is verstuurd." })).toBeVisible();
    await ctx.close();
  });

  test("flow 4: business wins the deal, customer confirms, invoice is paid via Mollie (test mode)", async ({ page }) => {
    await login(page, "bedrijf1@findersarmy.test", "/app/bedrijf/leads");
    await page.goto("/app/bedrijf/leads");
    await page.getByRole("link", { name: new RegExp(customerLast) }).click();
    await page.getByRole("button", { name: "Contact opgenomen" }).click();
    await expect(page.getByText("CONTACT", { exact: true }).first()).toBeVisible();
    await page.locator("label", { hasText: "Deal gewonnen" }).click();
    await page.getByLabel("Dealbedrag (excl. btw)").fill("4.200");
    await expect(page.getByText(/Fee bij dit bedrag/)).toBeVisible();
    await page.getByRole("button", { name: "Deal gewonnen" }).click();
    await expect(page.getByText("GEWONNEN", { exact: true }).first()).toBeVisible();

    // 15 days later the daily job asks the customer to confirm.
    const cron = await page.request.get("/api/cron/daily?offsetDays=15", { headers: { authorization: `Bearer ${process.env.CRON_SECRET ?? "dev-cron-secret"}` } });
    expect(cron.ok()).toBe(true);
    const confirmUrl = await mailLink(page, customerEmail, "/bevestig/");
    const customer = await page.context().browser()!.newPage();
    await customer.goto(confirmUrl.replace(/^https?:\/\/[^/]+/, new URL(page.url()).origin));
    await expect(customer.getByRole("heading", { level: 1 })).toContainText("Kwast");
    await customer.getByRole("button", { name: "Ja, de klus is uitgevoerd" }).click();
    await expect(customer.getByText("Bedankt voor je bevestiging.")).toBeVisible();
    await customer.close();

    // Invoice exists with a payment link; pay it through the (fake) Mollie checkout.
    await page.goto("/app/bedrijf/facturen");
    await expect(page.getByText(/FA-\d{4}-\d{5}/).first()).toBeVisible();
    await page.getByRole("link", { name: "Nu betalen" }).first().click();
    await expect(page.getByRole("heading", { name: "Testbetaling (iDEAL)" })).toBeVisible();
    await page.getByRole("button", { name: "Betaal" }).click();
    await expect(page).toHaveURL(/facturen\?betaald=/);
    await expect(page.getByText("BETAALD").first()).toBeVisible();

    // The invoice PDF is downloadable.
    const pdf = await page.request.get(await page.getByRole("link", { name: /Downloaden FA-/ }).first().getAttribute("href") as string);
    expect(pdf.headers()["content-type"]).toContain("application/pdf");
  });

  test("flow 5: finder sees available balance, requests payout, admin exports SEPA batch", async ({ page }) => {
    await login(page, finderEmail, "/app/finder/saldo");
    await page.goto("/app/finder/saldo");
    await expect(page.getByText("Beschikbaar").first()).toBeVisible();
    // € 4.200 × 8% = € 336 + € 100 boost = € 436 fee; Recruit 60% = € 261,60 (+ € 10 first-deal bonus)
    await expect(page.getByText("€ 271,60").first()).toBeVisible();

    await page.goto("/app/finder/profiel");
    await page.getByLabel("IBAN").fill("NL20 INGB 0001 2345 67");
    await page.getByLabel("Naam rekeninghouder").fill("F. Finder");
    await page.getByRole("button", { name: "Opslaan" }).click();
    await expect(page.getByText("Je profiel is opgeslagen.")).toBeVisible();

    await page.goto("/app/finder/saldo");
    await page.getByLabel("Bedrag").fill("271,60");
    await page.getByRole("button", { name: "Vraag uitbetaling aan" }).click();
    await expect(page.getByText(/uitbetaling is aangevraagd/)).toBeVisible();

    await login(page, "admin@findersarmy.test", "/admin/uitbetalingen");
    await page.goto("/admin/uitbetalingen");
    await page.getByRole("button", { name: "Alles goedkeuren" }).click();
    await page.getByRole("button", { name: "SEPA-batch maken" }).click();
    const link = page.getByRole("link", { name: "pain.001" }).first();
    await expect(link).toBeVisible();
    const xml = await (await page.request.get((await link.getAttribute("href"))!)).text();
    expect(xml).toContain("urn:iso:std:iso:20022:tech:xsd:pain.001.001.03");
    expect(xml).toContain("NL20INGB0001234567");
    expect(xml).toContain("<InstdAmt Ccy=\"EUR\">271.60</InstdAmt>");
    await page.getByRole("button", { name: "Markeer als uitbetaald" }).first().click();
    await expect(page.getByText("PAID").first()).toBeVisible();

    await login(page, finderEmail, "/app/finder/saldo");
    await page.goto("/app/finder/saldo");
    await expect(page.getByText("UITBETAALD").first()).toBeVisible();
  });
});
