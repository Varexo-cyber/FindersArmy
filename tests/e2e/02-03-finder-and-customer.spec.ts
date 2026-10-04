import { expect, test } from "@playwright/test";
import { signupLogin, unique } from "./helpers";

test.describe.serial("finder shares a link, customer requests a quote", () => {
  let referralUrl = "";
  const finderEmail = `${unique("finder")}@example.com`;

  test("finder signs up and shares a link", async ({ page }) => {
    await signupLogin(page, finderEmail, "/aanmelden/finder");
    await page.getByLabel("Volledige naam").fill("Yassin Testpersoon");
    await page.getByLabel("Geboortedatum").fill("2000-04-12");
    await page.getByLabel("Woonplaats").fill("Naaldwijk");
    await page.getByLabel("Telefoonnummer").fill("0687654321");
    await page.getByRole("checkbox", { name: /voorwaarden/ }).check();
    await page.getByRole("button", { name: "Account afmaken" }).click();

    await expect(page).toHaveURL(/app\/finder/);
    await expect(page.getByRole("heading", { name: "Ontdekken" })).toBeVisible();
    await page.getByRole("link", { name: /Schildersbedrijf Kwast/ }).first().click();
    await expect(page.getByText("Verdien tot").first()).toBeVisible();
    await page.getByRole("button", { name: "Deel je link" }).click();
    const url = page.getByTestId("referral-url");
    await expect(url).toContainText("/r/");
    referralUrl = (await url.textContent())!.trim();
    await expect(page.getByRole("link", { name: "Via WhatsApp" })).toHaveAttribute("href", /wa\.me/);
    await page.getByRole("button", { name: "QR-code" }).click();
    await expect(page.locator("svg").filter({ has: page.locator("path") }).last()).toBeVisible();
  });

  test("customer opens the link and sends a request", async ({ browser, baseURL }) => {
    // A different person on a different network: the customer must not look like the Finder's device.
    const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "203.0.113.77" } });
    const page = await context.newPage();
    const path = new URL(referralUrl).pathname;
    await page.goto(`${baseURL}${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Yassin");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Kwast");

    const customerEmail = `${unique("klant")}@example.com`;
    await page.getByLabel("Voornaam").fill("Mark");
    await page.getByLabel("Achternaam").fill("de Klant");
    const customerPhone = `06${String(Date.now()).slice(-8)}`;
    await page.getByLabel("Telefoonnummer").fill(customerPhone);
    await page.getByLabel("E-mailadres").fill(customerEmail);
    await page.getByLabel("Postcode").fill("2671 CD");
    await page.getByLabel("Huisnummer").fill("8");
    await page.getByLabel("Wat heb je nodig?").fill("Buitenkozijnen en dakgoten laten schilderen.");
    // Consent is required and not pre-checked.
    await page.getByRole("button", { name: "Verstuur aanvraag" }).click();
    await expect(page.getByText("Zonder toestemming")).toBeVisible();
    await page.getByRole("checkbox", { name: /toestemming/ }).check();
    await page.getByRole("button", { name: "Verstuur aanvraag" }).click();
    await expect(page.getByRole("heading", { name: "Je aanvraag is verstuurd." })).toBeVisible();

    // Confirmation to the customer, notification to the Finder.
    const customerMails = await (await page.request.get(`/api/dev/mail?format=json&to=${encodeURIComponent(customerEmail)}`)).json();
    expect(customerMails.some((m: { subject: string }) => m.subject.includes("is verstuurd"))).toBe(true);
    const finderMails = await (await page.request.get(`/api/dev/mail?format=json&to=${encodeURIComponent(finderEmail)}`)).json();
    expect(finderMails.some((m: { subject: string }) => m.subject.includes("aanvraag gedaan"))).toBe(true);

    // Same customer, same business, again: counted once (first attribution wins).
    await page.goto(`${baseURL}${path}`);
    await page.getByLabel("Voornaam").fill("Mark");
    await page.getByLabel("Achternaam").fill("de Klant");
    await page.getByLabel("Telefoonnummer").fill(customerPhone);
    await page.getByLabel("E-mailadres").fill(customerEmail);
    await page.getByLabel("Postcode").fill("2671 CD");
    await page.getByLabel("Huisnummer").fill("8");
    await page.getByLabel("Wat heb je nodig?").fill("Nog een keer dezelfde aanvraag voor de kozijnen.");
    await page.getByRole("checkbox", { name: /toestemming/ }).check();
    await page.getByRole("button", { name: "Verstuur aanvraag" }).click();
    await expect(page.getByRole("heading", { name: "Je hebt al een aanvraag lopen" })).toBeVisible();
    await context.close();
  });

  test("a finder cannot refer themselves", async ({ browser, baseURL }) => {
    const context = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "203.0.113.99" } });
    const page = await context.newPage();
    await page.goto(`${baseURL}${new URL(referralUrl).pathname}`);
    await page.getByLabel("Voornaam").fill("Yassin");
    await page.getByLabel("Achternaam").fill("Testpersoon");
    await page.getByLabel("Telefoonnummer").fill("0600000001");
    await page.getByLabel("E-mailadres").fill(finderEmail);
    await page.getByLabel("Postcode").fill("2671 CD");
    await page.getByLabel("Huisnummer").fill("1");
    await page.getByLabel("Wat heb je nodig?").fill("Ik probeer mezelf aan te brengen.");
    await page.getByRole("checkbox", { name: /toestemming/ }).check();
    await page.getByRole("button", { name: "Verstuur aanvraag" }).click();
    await expect(page.getByText("Je kunt geen aanvraag doen via je eigen link.")).toBeVisible();
    await context.close();
  });
});
