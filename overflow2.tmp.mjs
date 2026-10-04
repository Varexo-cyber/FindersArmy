import { chromium } from "@playwright/test";
const base = "http://localhost:3000";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
const page = await ctx.newPage();
const email = "finder1@findersarmy.test";
await page.goto(`${base}/login`); await page.fill("#email", email); await page.click("button[type=submit]");
await page.waitForURL(/check/, { waitUntil: "commit" });
const mails = await (await fetch(`${base}/api/dev/mail?format=json&to=${email}`)).json();
await page.goto(mails[0].links.find((l) => l.includes("callback")));
for (const path of ["/", "/bedrijven", "/finders", "/categorieen", "/categorieen/schilders", "/hoe-het-werkt", "/faq", "/over-ons", "/contact", "/app/finder"]) {
  await page.goto(base + path, { waitUntil: "load" });
  const r = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const bad = [...document.querySelectorAll("body *")].filter((e) => e.getBoundingClientRect().right > W + 1).slice(0, 4)
      .map((e) => `${e.tagName}.${(e.className?.toString?.() ?? "").slice(0, 70)} r=${Math.round(e.getBoundingClientRect().right)}`);
    return { sw: document.documentElement.scrollWidth, W, bad };
  });
  console.log(path, JSON.stringify(r));
}
await browser.close();
