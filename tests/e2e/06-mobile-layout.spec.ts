import { expect, test } from "@playwright/test";
import { login } from "./helpers";

/** 80% of Finders are on a phone: no page may scroll sideways at 375px. */
async function assertNoHorizontalScroll(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));
  expect(scrollWidth, `${path} scrolls horizontally`).toBeLessThanOrEqual(clientWidth);
}

test("public pages fit 375px", async ({ page }) => {
  for (const path of ["/", "/finders", "/bedrijven", "/hoe-het-werkt", "/categorieen", "/categorieen/zonnepanelen", "/faq", "/over-ons", "/contact", "/privacy", "/voorwaarden/bedrijven", "/en", "/login", "/r/demo10"]) {
    await assertNoHorizontalScroll(page, path);
  }
});

test("finder app fits 375px", async ({ page }) => {
  await login(page, "finder1@findersarmy.test", "/app/finder");
  for (const path of ["/app/finder", "/app/finder/klanten", "/app/finder/saldo", "/app/finder/rang", "/app/finder/profiel", "/app/meldingen"]) {
    await assertNoHorizontalScroll(page, path);
  }
});

test("unknown pages show the branded 404", async ({ page }) => {
  const res = await page.goto("/deze-pagina-bestaat-niet");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("Deze pagina bestaat niet.")).toBeVisible();
});
