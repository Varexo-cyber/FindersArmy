import fs from "node:fs"; globalThis.fs = fs;
import { chromium } from "@playwright/test";
const S = process.argv[2];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
for (const [f, w, scheme] of [["index.html", 1280, "light"], ["finder-saldo.html", 375, "dark"], ["schermen.html", 375, "light"]]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 }, colorScheme: scheme });
  const html = f === "index.html" ? `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${require_(f)}</body></html>` : null;
  if (html) await p.setContent(html, { waitUntil: "load" }); else await p.goto(`file://${S}/${f}`);
  await p.waitForTimeout(500);
  const sw = await p.evaluate(() => document.documentElement.scrollWidth);
  console.log(f, "scrollWidth", sw);
  await p.screenshot({ path: `${S}/../check-${f}.png`, fullPage: false });
}
await b.close();
function require_(f) { return (await_ => await_)(globalThis.fs.readFileSync(`${S}/${f}`, "utf8")); }
