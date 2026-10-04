/**
 * The assistant's knowledge is generated from the same sources the website renders from:
 * the translation files (all page copy), the FAQ, the category list with worked examples, the
 * rank ladder and the admin-editable settings. When the site changes, the assistant changes
 * with it; nothing is maintained twice.
 */
import nl from "../../../messages/nl.json";
import en from "../../../messages/en.json";
import { FAQ } from "@/content/faq";
import { CATEGORIES, CATEGORY_GROUPS, EXCLUDED_CATEGORIES } from "@/content/categories";
import { COMPANY } from "@/content/company";
import { categoryExample } from "../examples";
import { formatCents } from "../money";
import type { RankDefinition } from "../ranks";

export interface KnowledgeChunk {
  id: string;
  title: string;
  text: string;
  url: string;
}

type Locale = "nl" | "en";
type Messages = typeof nl;

const PAGE_SECTIONS: { ns: keyof Messages; url: string; title: { nl: string; en: string } }[] = [
  { ns: "home", url: "/", title: { nl: "Homepage", en: "Homepage" } },
  { ns: "finders", url: "/finders", title: { nl: "Voor Finders", en: "For Finders" } },
  { ns: "business", url: "/bedrijven", title: { nl: "Voor bedrijven", en: "For businesses" } },
  { ns: "how", url: "/hoe-het-werkt", title: { nl: "Hoe het werkt", en: "How it works" } },
  { ns: "about", url: "/over-ons", title: { nl: "Over ons", en: "About us" } },
  { ns: "contact", url: "/contact", title: { nl: "Contact", en: "Contact" } },
];

/** Flatten a message namespace into readable sentences (skips UI labels shorter than a sentence). */
function flatten(value: unknown): string[] {
  if (typeof value === "string") return value.length > 25 ? [value.replace(/<\/?[a-z]+>/g, "")] : [];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (value && typeof value === "object") return Object.values(value).flatMap(flatten);
  return [];
}

export interface LiveFacts {
  ranks: RankDefinition[];
  customerBonusCents: number;
  firstDealBonusCents: number;
  inviteBonusCents: number;
  payoutMinimumCents: number;
  confirmationDelayDays: number;
  invoiceDueDays: number;
  suspendAfterDays: number;
  responseHours: number;
  campaigns: { business: string; category: string; region: string; earnUpToCents: number; boost: string | null }[];
}

export function staticChunks(locale: Locale): KnowledgeChunk[] {
  const m = (locale === "en" ? en : nl) as Messages;
  const chunks: KnowledgeChunk[] = [];
  for (const s of PAGE_SECTIONS) {
    chunks.push({ id: `page:${s.ns}`, title: s.title[locale], text: flatten(m[s.ns]).join(" "), url: s.url });
  }
  for (const [group, items] of Object.entries(FAQ[locale])) {
    // The group label ("Voor bedrijven") is part of the text, so "what does it cost a business"
    // finds the business answer rather than the customer one.
    const label = (m.faq.groups as Record<string, string>)[group] ?? group;
    items.forEach((f, i) => chunks.push({ id: `faq:${group}:${i}`, title: f.q, text: `${label}: ${f.a}`, url: `/faq#${group}` }));
  }
  // One chunk per category, so "zonnepanelen" finds exactly that category.
  for (const c of CATEGORIES) {
    const ex = categoryExample(c);
    const g = CATEGORY_GROUPS.find((x) => x.key === c.group)!;
    const name = locale === "en" ? c.nameEn : c.nameNl;
    const text =
      locale === "en"
        ? `${c.descriptionEn} Typical job ${formatCents(ex.jobCents, locale)}, example fee ${formatCents(ex.feeCents, locale)}: a Recruit earns about ${formatCents(ex.finderCents, locale)} per job (worked example; the real fee is on each campaign). Who to send your link to: ${c.whoEn}`
        : `${c.descriptionNl} Typische klus ${formatCents(ex.jobCents, locale)}, voorbeeldfee ${formatCents(ex.feeCents, locale)}: een Rekruut verdient ongeveer ${formatCents(ex.finderCents, locale)} per klus (rekenvoorbeeld; de echte fee staat bij elke campagne). Naar wie stuur je je link: ${c.whoNl}`;
    chunks.push({ id: `cat:${c.slug}`, title: `${name} (${locale === "en" ? g.en : g.nl})`, text, url: `/categorieen/${c.slug}` });
  }
  chunks.push({
    id: "cat:excluded",
    title: locale === "en" ? "Excluded sectors" : "Uitgesloten sectoren",
    text: EXCLUDED_CATEGORIES.map((c) => `${locale === "en" ? c.nameEn : c.nameNl}: ${locale === "en" ? c.reasonEn : c.reasonNl}`).join("\n"),
    url: "/categorieen",
  });
  chunks.push({
    id: "company",
    title: locale === "en" ? "Company details" : "Bedrijfsgegevens",
    text: `FindersArmy · KvK ${COMPANY.kvk} · BTW ${COMPANY.vatNumber} · IBAN ${COMPANY.iban} · ${m.contact.email} · ${m.contact.businessEmail} · ${m.contact.privacyEmail}`,
    url: "/contact",
  });
  return chunks;
}

export function liveChunks(locale: Locale, live: LiveFacts): KnowledgeChunk[] {
  const rankNames = (locale === "en" ? en : nl).ranks as Record<string, string>;
  const ranks = live.ranks
    .map((r) => `${rankNames[r.key]}: ${r.minPaidDeals}+ ${locale === "en" ? "paid deals" : "betaalde deals"}, ${r.shareBps / 100}%`)
    .join("; ");
  const f = (c: number) => formatCents(c, locale);
  const rules =
    locale === "en"
      ? `Ranks and Finder share of every fee: ${ranks}. First-deal bonus ${f(live.firstDealBonusCents)}. Invite bonus ${f(live.inviteBonusCents)} once, when a friend you invited gets their first paid deal (one level only). Payouts from ${f(live.payoutMinimumCents)} available balance. Customers get a ${f(live.customerBonusCents)} gift card when they confirm the job; the confirmation email goes out ${live.confirmationDelayDays} days after a deal is won. Businesses must respond within ${live.responseHours} hours. Invoices are due in ${live.invoiceDueDays} days; after ${live.suspendAfterDays} days unpaid all campaigns are paused.`
      : `Rangen en Finder-aandeel van elke fee: ${ranks}. Eerste-deal-bonus ${f(live.firstDealBonusCents)}. Uitnodigingsbonus eenmalig ${f(live.inviteBonusCents)} als een vriend die jij uitnodigde zijn eerste betaalde deal binnenhaalt (strikt één niveau). Uitbetalen vanaf ${f(live.payoutMinimumCents)} beschikbaar saldo. Klanten krijgen een cadeaubon van ${f(live.customerBonusCents)} als ze de klus bevestigen; die bevestigingsmail gaat ${live.confirmationDelayDays} dagen na een gewonnen deal. Bedrijven reageren binnen ${live.responseHours} uur. Facturen hebben ${live.invoiceDueDays} dagen betaaltermijn; na ${live.suspendAfterDays} dagen onbetaald worden alle campagnes gepauzeerd.`;
  const campaigns = live.campaigns.length
    ? live.campaigns
        .map((c) => `${c.business} (${c.category}, ${c.region}): ${locale === "en" ? "earn up to" : "verdien tot"} ${f(c.earnUpToCents)}${c.boost ? ` · boost: ${c.boost}` : ""}`)
        .join("\n")
    : locale === "en"
      ? "No live campaigns right now."
      : "Op dit moment geen live campagnes.";
  return [
    { id: "live:rules", title: locale === "en" ? "Current rules and amounts" : "Actuele regels en bedragen", text: rules, url: "/finders" },
    { id: "live:campaigns", title: locale === "en" ? "Live campaigns (shown to Finders after login)" : "Live campagnes (zichtbaar voor Finders na inloggen)", text: campaigns, url: "/app/finder" },
  ];
}

export function renderKnowledge(chunks: KnowledgeChunk[]): string {
  return chunks.map((c) => `## ${c.title} (${c.url})\n${c.text}`).join("\n\n");
}

const STOP = new Set("de het een en of van in op is ik je jij wat hoe wie te met voor aan dat die er als bij om the a an and or of to in on is it you i what how who for with that this are be do does can".split(" "));

function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9€]+/)
    .filter((w) => w.length > 1 && !STOP.has(w));
}

/**
 * Offline answer: rank knowledge chunks by keyword overlap (with light prefix matching so
 * "verdien" finds "verdienen") and return the best ones. Used when no API key is configured.
 */
export function searchKnowledge(query: string, chunks: KnowledgeChunk[], limit = 2): KnowledgeChunk[] {
  const q = tokens(query);
  if (q.length === 0) return [];
  const docs = chunks.map((c) => ({ c, title: tokens(c.title), body: tokens(c.text) }));
  const stems = q.map((w) => w.slice(0, Math.max(4, w.length - 2)));
  // Rare words ("zonnepanelen") weigh more than common ones ("verdienen") via inverse document frequency.
  const idf = stems.map((stem) => {
    const df = docs.filter((d) => d.title.some((t) => t.startsWith(stem)) || d.body.some((t) => t.startsWith(stem))).length;
    return Math.log((docs.length + 1) / (df + 0.5));
  });
  const scored = docs.map((d) => {
    let score = 0;
    stems.forEach((stem, i) => {
      const w = Math.max(0, idf[i]!);
      if (d.title.some((t) => t.startsWith(stem))) score += 2 * w;
      const hits = d.body.filter((t) => t.startsWith(stem)).length;
      if (hits) score += w * (1 + Math.log2(hits));
    });
    // Mild preference for short, specific answers over long pages.
    return { c: d.c, score: score / Math.log2(16 + d.body.length / 80) };
  });
  const ranked = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  // Further hits only when they are nearly as relevant as the best one.
  const best = ranked[0]?.score ?? 0;
  return ranked.filter((s, i) => i === 0 || s.score >= best * 0.7).slice(0, limit).map((s) => s.c);
}

/** The most relevant sentences (or lines) of a chunk for a query, for offline answers. */
export function excerpt(chunk: KnowledgeChunk, query: string, max = 3): string {
  if (chunk.text.length < 400) return chunk.text;
  const q = tokens(query).map((w) => w.slice(0, Math.max(4, w.length - 2)));
  // Line-based chunks (categories, campaigns) keep each line whole; prose splits into sentences.
  const parts = (chunk.text.includes("\n") ? chunk.text.split("\n") : chunk.text.split(/(?<=[.!?])\s+/)).filter((p) => p.trim().length > 0);
  const ranked = parts
    .map((p, i) => ({ p, i, s: tokens(p).filter((t) => q.some((w) => t.startsWith(w))).length }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, max)
    .sort((a, b) => a.i - b.i);
  const sep = chunk.text.includes("\n") ? "\n" : " ";
  return (ranked.length ? ranked.map((x) => x.p) : parts.slice(0, max)).map((p) => (sep === "\n" ? `- ${p}` : p)).join(sep);
}
