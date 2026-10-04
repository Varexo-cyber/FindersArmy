import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";
import { getSettings } from "./settings";
import { now } from "./clock";
import { maxFinderEarning } from "../fees";
import { rankFor } from "../ranks";
import { ruleFromCampaign } from "./services/fees";
import { excerpt, liveChunks, renderKnowledge, searchKnowledge, staticChunks, type KnowledgeChunk, type LiveFacts } from "../assistant/knowledge";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

async function liveFacts(): Promise<LiveFacts> {
  const s = await getSettings();
  const t = now();
  const campaigns = await db.campaign.findMany({
    where: { status: "LIVE", business: { status: "ACTIVE" } },
    include: { business: { include: { category: true } }, boosts: { where: { startsAt: { lte: t }, endsAt: { gte: t } }, take: 1, orderBy: { extraFeeCents: "desc" } } },
    take: 60,
  });
  const share = rankFor(0, s.ranks).shareBps;
  return {
    ranks: s.ranks,
    customerBonusCents: s.customerBonusCents,
    firstDealBonusCents: s.firstDealBonusCents,
    inviteBonusCents: s.inviteBonusCents,
    payoutMinimumCents: s.payoutMinimumCents,
    confirmationDelayDays: s.confirmationDelayDays,
    invoiceDueDays: s.invoiceDueDays,
    suspendAfterDays: s.suspendAfterDays,
    responseHours: s.responseHours,
    campaigns: campaigns.map((c) => ({
      business: c.business.name,
      category: c.business.category.nameNl,
      region: c.region,
      earnUpToCents: maxFinderEarning(ruleFromCampaign(c), share, c.business.category.exampleJobCents, c.boosts[0]?.extraFeeCents ?? 0),
      boost: c.boosts[0]?.label ?? null,
    })),
  };
}

const SYSTEM = {
  nl: `Je bent de hulp-assistent van FindersArmy, rechtsonder op de website. Latency-sensitive; begin je zichtbare antwoord direct.
FindersArmy koppelt Finders (mensen die iemand kennen die iets nodig heeft) aan lokale bedrijven. Bedrijven betalen alleen een finder's fee als een aangebrachte klant echt klant wordt; de Finder krijgt het grootste deel.
Hoe je antwoordt:
- Antwoord in de taal van de gebruiker, kort en concreet, in je-vorm, zoals een behulpzame collega. Meestal 2 tot 5 zinnen; gebruik een korte opsomming als dat duidelijker is.
- Baseer je op de kennis hieronder. Noem bedragen precies zoals ze daar staan en zeg erbij als iets een rekenvoorbeeld is.
- Verwijs naar de juiste pagina met een markdown-link, bijvoorbeeld [Voor bedrijven](/bedrijven).
- Weet je iets niet zeker, zeg dat dan en verwijs naar hallo@findersarmy.com. Verzin nooit cijfers, resultaten, reviews, bedrijven of beloftes.
- Je kunt geen accounts, leads of betalingen inzien of wijzigen. Voor persoonlijke vragen: inloggen of contact opnemen.
- Vraag niet om persoonsgegevens. Geef geen fiscaal of juridisch advies op maat; geef algemene informatie en verwijs naar een boekhouder of de officiële bron.
- Je mag de webzoekfunctie gebruiken voor algemene vragen over bijvoorbeeld belasting of de KvK; noem dan de bron.
- Wees enthousiast over verdienen, maar eerlijk: een fee komt pas als de klus doorgaat en het bedrijf heeft betaald.`,
  en: `You are FindersArmy's help assistant, bottom-right on the website. Latency-sensitive; begin your visible answer immediately.
FindersArmy connects Finders (people who know someone who needs something) with local businesses. Businesses only pay a finder's fee when a referred customer actually becomes a customer; the Finder gets most of it.
How to answer:
- Reply in the user's language, short and concrete, like a helpful colleague. Usually 2 to 5 sentences; use a short list when clearer.
- Base answers on the knowledge below. Quote amounts exactly and say when something is a worked example.
- Link to the right page with a markdown link, e.g. [For businesses](/en/bedrijven).
- If unsure, say so and point to hallo@findersarmy.com. Never invent numbers, results, reviews, businesses or promises.
- You cannot see or change accounts, leads or payments. For personal questions: log in or contact us.
- Don't ask for personal data. No tailored tax or legal advice; give general information and point to an accountant or the official source.
- You may use web search for general questions such as tax or Chamber of Commerce rules; cite the source.
- Be upbeat about earning, but honest: a fee only comes when the job goes ahead and the business has paid.`,
};

export function assistantEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

const encoder = new TextEncoder();

/** Answer without a model: the best-matching knowledge, quoted, with links. */
export async function offlineAnswer(locale: "nl" | "en", question: string): Promise<string> {
  const chunks: KnowledgeChunk[] = [...staticChunks(locale), ...liveChunks(locale, await liveFacts())];
  const hits = searchKnowledge(question, chunks, 2);
  if (hits.length === 0) {
    return locale === "en"
      ? "I couldn't find that on the site. Try asking about earning, payouts, ranks, categories or signing up a business, or email hallo@findersarmy.com."
      : "Dat kon ik niet vinden op de site. Vraag me iets over verdienen, uitbetalen, rangen, categorieën of een bedrijf aanmelden, of mail hallo@findersarmy.com.";
  }
  return hits.map((h) => `**${h.title}**\n${excerpt(h, question)}\n[${locale === "en" ? "Read more" : "Lees meer"}](${locale === "en" && !h.url.startsWith("/en") ? `/en${h.url === "/" ? "" : h.url}` : h.url})`).join("\n\n");
}

export function textStream(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

let client: Anthropic | null = null;

/**
 * Stream an answer from Claude. The site knowledge goes into a cached system block (stable
 * between requests); live campaigns and settings follow in a separate, uncached block.
 */
export async function claudeAnswer(locale: "nl" | "en", messages: ChatMessage[], page: string): Promise<ReadableStream<Uint8Array>> {
  client ??= new Anthropic();
  const stable = renderKnowledge(staticChunks(locale));
  const live = renderKnowledge(liveChunks(locale, await liveFacts()));
  const stream = client.beta.messages.stream({
    model: process.env.ASSISTANT_MODEL || "claude-opus-5-5",
    max_tokens: 4000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [
      { type: "text", text: `${SYSTEM[locale]}\n\n# Kennis van de website\n\n${stable}`, cache_control: { type: "ephemeral" } },
      { type: "text", text: `# Actueel\n\n${live}\n\nDe gebruiker kijkt nu naar: ${page.slice(0, 200)}` },
    ],
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 2,
        allowed_domains: ["belastingdienst.nl", "kvk.nl", "rijksoverheid.nl", "autoriteitpersoonsgegevens.nl", "consuwijzer.nl"],
      },
    ],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode(locale === "en" ? "\n\nI can't help with that one. Email hallo@findersarmy.com." : "\n\nDaar kan ik je niet mee helpen. Mail gerust naar hallo@findersarmy.com."));
        }
      } catch (error) {
        console.error(JSON.stringify({ event: "assistant_failed", error: String(error) }));
        // Fall back to the knowledge search rather than leaving the visitor with nothing.
        const last = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";
        controller.enqueue(encoder.encode(await offlineAnswer(locale, last)));
      } finally {
        controller.close();
      }
    },
  });
}
