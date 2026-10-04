import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3100";
const OUT = process.argv[2];
fs.mkdirSync(OUT, { recursive: true });

// route → [file, label, group]
const PUBLIC = [
  ["/", "index.html", "Homepage", "Website"],
  ["/finders", "finders.html", "Voor Finders", "Website"],
  ["/bedrijven", "bedrijven.html", "Voor bedrijven", "Website"],
  ["/hoe-het-werkt", "hoe-het-werkt.html", "Hoe het werkt", "Website"],
  ["/categorieen", "categorieen.html", "Categorieën", "Website"],
  ["/categorieen/schilders", "categorie-schilders.html", "Categorie: Schilders", "Website"],
  ["/faq", "faq.html", "FAQ", "Website"],
  ["/over-ons", "over-ons.html", "Over ons", "Website"],
  ["/contact", "contact.html", "Contact", "Website"],
  ["/voorwaarden/finders", "voorwaarden-finders.html", "Voorwaarden Finders", "Juridisch (concept)"],
  ["/voorwaarden/bedrijven", "voorwaarden-bedrijven.html", "Voorwaarden bedrijven", "Juridisch (concept)"],
  ["/privacy", "privacy.html", "Privacyverklaring", "Juridisch (concept)"],
  ["/cookies", "cookies.html", "Cookieverklaring", "Juridisch (concept)"],
  ["/en", "en-home.html", "Homepage (English)", "Website"],
  ["/login", "login.html", "Inloggen", "Aanmelden"],
  ["/aanmelden/bedrijf", "aanmelden-bedrijf.html", "Bedrijf aanmelden", "Aanmelden"],
  ["/aanmelden/finder", "aanmelden-finder.html", "Finder worden", "Aanmelden"],
  ["/r/demo10", "referral.html", "Klantpagina /r/{code}", "Klant"],
  ["/deze-pagina-bestaat-niet", "404.html", "404-pagina", "Website"],
];
const FINDER = [
  ["/app/finder", "finder-ontdekken.html", "Ontdekken", "Finder-app"],
  ["CAMPAIGN", "finder-campagne.html", "Campagne + delen", "Finder-app"],
  ["/app/finder/klanten", "finder-klanten.html", "Mijn klanten", "Finder-app"],
  ["/app/finder/saldo", "finder-saldo.html", "Saldo + uitbetalen", "Finder-app"],
  ["/app/finder/rang", "finder-rang.html", "Rang, ranglijst, uitnodigen", "Finder-app"],
  ["/app/finder/profiel", "finder-profiel.html", "Profiel", "Finder-app"],
];
const BUSINESS = [
  ["/app/bedrijf", "bedrijf-overzicht.html", "Overzicht", "Bedrijfsdashboard"],
  ["/app/bedrijf/leads", "bedrijf-aanvragen.html", "Aanvragen", "Bedrijfsdashboard"],
  ["LEAD", "bedrijf-aanvraag.html", "Aanvraag + status bijwerken", "Bedrijfsdashboard"],
  ["/app/bedrijf/campagnes", "bedrijf-campagnes.html", "Campagnes + boosts", "Bedrijfsdashboard"],
  ["/app/bedrijf/facturen", "bedrijf-facturen.html", "Facturen", "Bedrijfsdashboard"],
];
const ADMIN = [
  ["/admin", "admin-dashboard.html", "Dashboard", "Admin"],
  ["/admin/bedrijven?status=ALL", "admin-bedrijven.html", "Bedrijven", "Admin"],
  ["/admin/leads", "admin-leads.html", "Leads", "Admin"],
  ["/admin/geschillen", "admin-geschillen.html", "Geschillen & meldingen", "Admin"],
  ["/admin/facturen", "admin-facturen.html", "Facturen", "Admin"],
  ["/admin/uitbetalingen", "admin-uitbetalingen.html", "Uitbetalingen + SEPA", "Admin"],
  ["/admin/instellingen", "admin-instellingen.html", "Instellingen", "Admin"],
];

const routeMap = new Map();
for (const [r, f] of [...PUBLIC, ...FINDER, ...BUSINESS, ...ADMIN]) routeMap.set(r.split("?")[0], f);
routeMap.set("/admin/bedrijven", "admin-bedrijven.html");
routeMap.set("/aanmelden/finder", "aanmelden-bedrijf.html".replace("bedrijf", "finder"));

// Shared CSS with fonts inlined as data URIs.
const cssCache = new Map();
async function inlineCss(href) {
  if (cssCache.has(href)) return cssCache.get(href);
  let css = await (await fetch(BASE + href)).text();
  const urls = [...new Set([...css.matchAll(/url\((\/_next\/static\/media\/[^)]+)\)/g)].map((m) => m[1]))];
  for (const u of urls) {
    const buf = Buffer.from(await (await fetch(BASE + u)).arrayBuffer());
    css = css.split(`url(${u})`).join(`url(data:font/woff2;base64,${buf.toString("base64")})`);
  }
  cssCache.set(href, css);
  return css;
}

const NOTE = `<div style="background:#3A4A2E;color:#F5F3EE;font:12px/1.4 ui-monospace,Menlo,monospace;letter-spacing:.04em;padding:8px 16px;display:flex;gap:12px;flex-wrap:wrap;justify-content:space-between;align-items:center"><span>FINDERSARMY · PREVIEW · statische momentopname met fictieve demodata — knoppen en formulieren werken alleen in de echte app</span><a href="schermen.html" style="color:#D4FF3F;text-decoration:underline">Alle schermen →</a></div>`;

async function convert(page, file, title) {
  const html = await page.content();
  const htmlClass = (html.match(/<html[^>]*class="([^"]*)"/) || [])[1] || "";
  const theme = `<script>(function(){var d=document.documentElement;d.className+=" ${htmlClass}";if(!d.getAttribute("data-theme")){d.setAttribute("data-theme",matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}new MutationObserver(function(){}).observe(d,{attributes:true});document.addEventListener("submit",function(e){e.preventDefault()},true)})();</script>`;
  let styles = "";
  for (const m of html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) styles += `<style>${await inlineCss(m[1])}</style>`;
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) styles += `<style>${m[1]}</style>`;
  let body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  body = body
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<next-route-announcer[\s\S]*?<\/next-route-announcer>/g, "")
    .replace(/<nextjs-portal[\s\S]*?<\/nextjs-portal>/g, "")
    .replace(/ href="(\/[^"#]*)(#[^"]*)?"/g, (all, p, hash) => {
      const clean = p.split("?")[0].replace(/\/$/, "") || "/";
      const target = routeMap.get(clean) ?? (clean.startsWith("/en") && clean.length > 3 ? routeMap.get(clean.slice(3)) : undefined);
      if (target) return ` href="${target}${hash ?? ""}"`;
      return ` href="#" data-preview-disabled="1"`;
    })
    .replace(/ src="\/(icon[^"]*)"/g, (_, f) => ` src="${f}"`);
  const doc = `<title>${title}</title>${styles}${theme}${NOTE}${body}`;
  fs.writeFileSync(path.join(OUT, file), file === "index.html" ? doc : `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${doc.replace(/<\/style>(?![\s\S]*<\/style>)/, "</style></head><body>")}</body></html>`);
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
async function run(email, list) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  if (email) {
    await page.goto(`${BASE}/login`);
    await page.fill("#email", email);
    await page.click("button[type=submit]");
    await page.waitForURL(/check/, { waitUntil: "commit" });
    const mails = await (await fetch(`${BASE}/api/dev/mail?format=json&to=${email}`)).json();
    await page.goto(mails[0].links.find((l) => l.includes("callback")));
  }
  for (const [route, file, label] of list) {
    let url = route;
    if (route === "CAMPAIGN") {
      await page.goto(`${BASE}/app/finder`);
      url = await page.locator("a[href*='/app/finder/campagne/']").first().getAttribute("href");
      routeMap.set(url, file);
    }
    if (route === "LEAD") {
      await page.goto(`${BASE}/app/bedrijf/leads?status=WON`);
      url = await page.locator("a[href*='/app/bedrijf/leads/']").first().getAttribute("href");
      routeMap.set(url, file);
    }
    await page.goto(BASE + url, { waitUntil: "load" });
    await page.waitForTimeout(300);
    await convert(page, file, `FindersArmy · ${label}`);
    console.log("ok", file);
  }
  await ctx.close();
}
// Collect dynamic routes first so cross-links resolve, then render everything.
await run("finder1@findersarmy.test", FINDER);
await run("bedrijf1@findersarmy.test", BUSINESS);
await run(null, PUBLIC);
await run("admin@findersarmy.test", ADMIN);
await run("finder1@findersarmy.test", FINDER);
await run("bedrijf1@findersarmy.test", BUSINESS);
await browser.close();

for (const f of ["icon.svg"]) fs.copyFileSync(`public/${f}`, path.join(OUT, f));
fs.writeFileSync(path.join(OUT, "_groups.json"), JSON.stringify([...PUBLIC, ...FINDER, ...BUSINESS, ...ADMIN].map(([r, f, l, g]) => ({ file: f, label: l, group: g }))));
