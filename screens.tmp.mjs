import fs from "node:fs";
const OUT = process.argv[2];
const items = JSON.parse(fs.readFileSync(`${OUT}/_groups.json`, "utf8"));
const groups = [...new Set(items.map((i) => i.group))];
const css = fs.readFileSync(`${OUT}/index.html`, "utf8").match(/<style>[\s\S]*?<\/style>/)[0];
const intro = {
  Website: "De publieke site op findersarmy.com. Nederlands op /, Engels op /en.",
  "Juridisch (concept)": "Volledige concepten. Laten controleren door een jurist vóór livegang.",
  Aanmelden: "Inloggen zonder wachtwoord: magic link of Google.",
  Klant: "Wat de klant ziet als hij de link van een Finder opent.",
  "Finder-app": "Ingelogd als demo-Finder. Mobiel-eerst; installeerbaar als app.",
  Bedrijfsdashboard: "Ingelogd als Schildersbedrijf Kwast & Co (demo).",
  Admin: "Ingelogd als super admin. Alle cijfers komen uit de database.",
};
const body = `
<main style="max-width:1100px;margin:0 auto;padding-block:48px 80px;padding-inline:16px;display:flex;flex-direction:column;gap:40px">
  <header style="display:flex;flex-direction:column;gap:12px">
    <a href="index.html" style="display:inline-flex;align-items:center;gap:10px;color:var(--fg);text-decoration:none"><img src="icon.svg" width="28" height="28" alt=""><span class="font-display" style="font-size:19px;font-weight:700;letter-spacing:-.04em">FindersArmy</span></a>
    <p class="eyebrow">Preview · ${items.length} schermen</p>
    <h1 class="font-display" style="font-size:clamp(2.4rem,6vw,4.5rem);line-height:.98;letter-spacing:-.03em;margin:0">Alle schermen</h1>
    <p style="max-width:62ch;color:var(--subtle);font-size:17px;margin:0">Momentopnames van de werkende app met fictieve demodata. Klik door naar elk scherm; links tussen schermen werken, knoppen en formulieren niet (die hebben de echte server nodig).</p>
  </header>
  ${groups.map((g) => `
  <section style="display:grid;gap:16px;grid-template-columns:minmax(0,1fr)">
    <div style="display:flex;flex-direction:column;gap:4px;border-top:1px solid var(--border);padding-top:16px">
      <h2 class="font-display" style="font-size:24px;margin:0;letter-spacing:-.02em">${g}</h2>
      <p style="margin:0;color:var(--subtle);font-size:14px">${intro[g] ?? ""}</p>
    </div>
    <ul style="list-style:none;margin:0;padding:0;display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))">
      ${items.filter((i) => i.group === g).map((i) => `<li><a href="${i.file}" style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;border:1px solid var(--border);border-radius:6px;background:var(--surface);color:var(--fg);text-decoration:none;font-weight:500">${i.label}<span aria-hidden="true" style="color:var(--subtle)">→</span></a></li>`).join("")}
    </ul>
  </section>`).join("")}
</main>`;
const theme = `<script>(function(){var d=document.documentElement;if(!d.getAttribute("data-theme")){d.setAttribute("data-theme",matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}})();</script>`;
fs.writeFileSync(`${OUT}/schermen.html`, `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>FindersArmy · Alle schermen</title>${css}<style>a:hover{border-color:var(--fg)!important}a:focus-visible{outline:2px solid var(--focus);outline-offset:2px}</style>${theme}</head><body>${body}</body></html>`);
fs.unlinkSync(`${OUT}/_groups.json`);
