import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatCents } from "../money";

const INK = rgb(0.055, 0.059, 0.047);
const MUTED = rgb(0.42, 0.43, 0.4);
const LINE = rgb(0.886, 0.874, 0.843);
const OLIVE = rgb(0.227, 0.29, 0.18);

interface Ctx {
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  mono: PDFFont;
}

/** Standard PDF fonts are WinAnsi; strip anything outside it rather than crash on a customer's name. */
function safe(text: string): string {
  return text.replace(/[^\x20-\x7E -ÿ€–—‘’“”•]/g, "?");
}

function text(ctx: Ctx, value: string, x: number, y: number, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb> } = {}) {
  ctx.page.drawText(safe(value), { x, y, size: opts.size ?? 10, font: opts.font ?? ctx.font, color: opts.color ?? INK });
}

function rightText(ctx: Ctx, value: string, xRight: number, y: number, opts: { size?: number; font?: PDFFont } = {}) {
  const font = opts.font ?? ctx.font;
  const size = opts.size ?? 10;
  const w = font.widthOfTextAtSize(safe(value), size);
  text(ctx, value, xRight - w, y, { size, font });
}

function hr(ctx: Ctx, y: number) {
  ctx.page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 0.75, color: LINE });
}

async function setup() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]);
  const ctx: Ctx = {
    page,
    font: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    mono: await doc.embedFont(StandardFonts.Courier),
  };
  // Header bar: wordmark + olive rule.
  text(ctx, "FINDERSARMY", 50, 790, { size: 13, font: ctx.bold });
  page.drawRectangle({ x: 50, y: 780, width: 495, height: 2, color: OLIVE });
  return { doc, ctx };
}

export interface Company {
  name: string;
  street: string;
  postcodeCity: string;
  kvk: string;
  vatNumber: string;
  iban: string;
  email: string;
}

export interface InvoicePdfInput {
  number: string;
  issuedAt: Date;
  dueAt: Date;
  company: Company;
  business: { name: string; contactName: string; street: string; houseNumber: string; postcode: string; city: string; vatNumber: string; kvk: string };
  lines: { description: string; amountCents: number }[];
  subtotalCents: number;
  vatRateBps: number;
  vatCents: number;
  totalCents: number;
  paymentUrl?: string | null;
  status: string;
}

const date = (d: Date) => d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Amsterdam" });

export async function invoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const { doc, ctx } = await setup();
  text(ctx, "Factuur", 50, 740, { size: 26, font: ctx.bold });
  text(ctx, input.number, 50, 718, { size: 12, font: ctx.mono });
  if (input.status === "PAID") text(ctx, "BETAALD", 470, 740, { size: 12, font: ctx.bold, color: OLIVE });

  // From / to
  let y = 680;
  text(ctx, "VAN", 50, y, { size: 8, color: MUTED });
  text(ctx, "AAN", 310, y, { size: 8, color: MUTED });
  y -= 15;
  const from = [input.company.name, input.company.street, input.company.postcodeCity, `KvK ${input.company.kvk}`, `BTW ${input.company.vatNumber}`, input.company.email].filter(Boolean);
  const to = [input.business.name, `t.a.v. ${input.business.contactName}`, `${input.business.street} ${input.business.houseNumber}`, `${input.business.postcode} ${input.business.city}`, `KvK ${input.business.kvk}`, `BTW ${input.business.vatNumber}`];
  for (let i = 0; i < Math.max(from.length, to.length); i++) {
    if (from[i]) text(ctx, from[i]!, 50, y);
    if (to[i]) text(ctx, to[i]!, 310, y);
    y -= 14;
  }

  y -= 16;
  text(ctx, "FACTUURDATUM", 50, y, { size: 8, color: MUTED });
  text(ctx, "VERVALDATUM", 200, y, { size: 8, color: MUTED });
  text(ctx, "BETAALTERMIJN", 350, y, { size: 8, color: MUTED });
  y -= 14;
  text(ctx, date(input.issuedAt), 50, y);
  text(ctx, date(input.dueAt), 200, y);
  text(ctx, `${Math.round((input.dueAt.getTime() - input.issuedAt.getTime()) / 86_400_000)} dagen`, 350, y);

  y -= 36;
  text(ctx, "OMSCHRIJVING", 50, y, { size: 8, color: MUTED });
  rightText(ctx, "BEDRAG", 545, y, { size: 8 });
  y -= 8;
  hr(ctx, y);
  y -= 18;
  for (const line of input.lines) {
    text(ctx, line.description.slice(0, 80), 50, y);
    rightText(ctx, formatCents(line.amountCents), 545, y, { font: ctx.mono });
    y -= 18;
  }
  hr(ctx, y + 6);
  y -= 10;
  const totals: [string, number, boolean][] = [
    ["Subtotaal", input.subtotalCents, false],
    [`BTW ${(input.vatRateBps / 100).toLocaleString("nl-NL")}%`, input.vatCents, false],
    ["Totaal", input.totalCents, true],
  ];
  for (const [label, cents, strong] of totals) {
    text(ctx, label, 350, y, { font: strong ? ctx.bold : ctx.font, size: strong ? 12 : 10 });
    rightText(ctx, formatCents(cents), 545, y, { font: ctx.mono, size: strong ? 12 : 10 });
    y -= strong ? 22 : 16;
  }

  y -= 20;
  text(ctx, "BETALEN", 50, y, { size: 8, color: MUTED });
  y -= 14;
  if (input.status === "PAID") {
    text(ctx, "Deze factuur is voldaan. Dank je wel.", 50, y);
  } else {
    text(ctx, `Betaal online met iDEAL, Bancontact of creditcard via de betaallink in je dashboard of e-mail.`, 50, y);
    y -= 14;
    text(ctx, `Of maak ${formatCents(input.totalCents)} over naar ${input.company.iban} o.v.v. ${input.number}.`, 50, y);
    if (input.paymentUrl) {
      y -= 14;
      text(ctx, input.paymentUrl.slice(0, 95), 50, y, { size: 8, font: ctx.mono, color: MUTED });
    }
  }

  text(ctx, "Finder's fee op basis van resultaat: je betaalt alleen voor klanten die via FindersArmy zijn binnengekomen en klant zijn geworden.", 50, 60, { size: 7.5, color: MUTED });
  return doc.save();
}

export interface PayoutPdfInput {
  reference: string;
  finderName: string;
  ibanMasked: string;
  requestedAt: Date;
  paidAt: Date | null;
  amountCents: number;
  status: string;
  lines: { date: Date; description: string; amountCents: number }[];
  company: Company;
}

export async function payoutSpecificationPdf(input: PayoutPdfInput): Promise<Uint8Array> {
  const { doc, ctx } = await setup();
  text(ctx, "Uitbetalingsspecificatie", 50, 740, { size: 22, font: ctx.bold });
  text(ctx, input.reference, 50, 718, { size: 11, font: ctx.mono });
  let y = 680;
  const meta: [string, string][] = [
    ["Finder", input.finderName],
    ["Rekening", input.ibanMasked],
    ["Aangevraagd", date(input.requestedAt)],
    ["Uitbetaald", input.paidAt ? date(input.paidAt) : "nog niet uitbetaald"],
    ["Status", input.status],
  ];
  for (const [k, v] of meta) {
    text(ctx, k.toUpperCase(), 50, y, { size: 8, color: MUTED });
    text(ctx, v, 160, y);
    y -= 16;
  }
  y -= 10;
  text(ctx, "Bedrag", 50, y, { size: 10, color: MUTED });
  y -= 26;
  text(ctx, formatCents(input.amountCents), 50, y, { size: 24, font: ctx.mono });
  y -= 36;
  text(ctx, "OPGEBOUWD UIT (BIJGESCHREVEN VERDIENSTEN)", 50, y, { size: 8, color: MUTED });
  y -= 8;
  hr(ctx, y);
  y -= 16;
  for (const l of input.lines.slice(0, 30)) {
    text(ctx, date(l.date), 50, y, { size: 9 });
    text(ctx, l.description.slice(0, 60), 160, y, { size: 9 });
    rightText(ctx, formatCents(l.amountCents), 545, y, { font: ctx.mono, size: 9 });
    y -= 15;
  }
  text(ctx, `${input.company.name} · KvK ${input.company.kvk} · ${input.company.email}`, 50, 60, { size: 7.5, color: MUTED });
  text(ctx, "Bewaar deze specificatie voor je eigen administratie.", 50, 48, { size: 7.5, color: MUTED });
  return doc.save();
}
