import { chromium } from "@playwright/test";
const base = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
async function session(email, { width = 375, scheme = "light" } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 860 }, colorScheme: scheme });
  const page = await ctx.newPage();
  await page.goto(`${base}/login`);
  await page.fill("#email", email);
  await page.click("button[type=submit]");
  await page.waitForURL(/check/, { waitUntil: "commit" });
  const mails = await (await fetch(`${base}/api/dev/mail?format=json&to=${email}`)).json();
  await page.goto(mails[0].links.find((l) => l.includes("callback")));
  return page;
}
const shots = [
  ["finder1@findersarmy.test", [["/app/finder", "finder-discover"], ["/app/finder/klanten", "finder-klanten"], ["/app/finder/saldo", "finder-saldo"], ["/app/finder/rang", "finder-rang"]], {}],
  ["bedrijf1@findersarmy.test", [["/app/bedrijf", "biz-overview"], ["/app/bedrijf/leads", "biz-leads"]], { width: 1280 }],
  ["admin@findersarmy.test", [["/admin", "admin-dash"]], { width: 1280, scheme: "dark" }],
];
for (const [email, pages, opts] of shots) {
  const page = await session(email, opts);
  for (const [path, name] of pages) {
    await page.goto(base + path, { waitUntil: "load" });
    await page.screenshot({ path: `/tmp/claude-0/shots/${name}.png`, fullPage: true });
  }
  if (email.startsWith("bedrijf")) {
    await page.goto(base + "/app/bedrijf/leads", { waitUntil: "load" });
    await page.locator("a[href*='/app/bedrijf/leads/']").first().click();
    await page.waitForLoadState("load");
    await page.screenshot({ path: `/tmp/claude-0/shots/biz-lead.png`, fullPage: true });
  }
}
await browser.close();
