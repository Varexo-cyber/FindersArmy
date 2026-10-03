/**
 * Seed data. Everything here is fictitious and marked as such: business names end in "(demo)",
 * e-mail addresses use the reserved .test TLD, KvK numbers start with 0000.
 * Run with: pnpm db:seed   (idempotent: wipes demo rows and recreates them)
 */
import { PrismaClient, type FeeType } from "@prisma/client";
import { CATEGORIES, EXCLUDED_CATEGORIES } from "../src/content/categories";
import { calculateFee } from "../src/lib/fees";
import { rankFor } from "../src/lib/ranks";

const db = new PrismaClient();
const DAY = 86_400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY);

async function categories() {
  let order = 0;
  for (const c of CATEGORIES) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, nameNl: c.nameNl, nameEn: c.nameEn, descriptionNl: c.descriptionNl, descriptionEn: c.descriptionEn, exampleJobCents: c.exampleJobCents, sortOrder: order++ },
      update: { nameNl: c.nameNl, nameEn: c.nameEn, descriptionNl: c.descriptionNl, descriptionEn: c.descriptionEn, exampleJobCents: c.exampleJobCents, sortOrder: order++ },
    });
  }
  for (const c of EXCLUDED_CATEGORIES) {
    await db.category.upsert({
      where: { slug: c.slug },
      create: { slug: c.slug, nameNl: c.nameNl, nameEn: c.nameEn, excluded: true, excludedReason: c.reasonNl, sortOrder: order++ },
      update: { excluded: true, excludedReason: c.reasonNl },
    });
  }
}

async function wipeDemo() {
  const demoUsers = await db.user.findMany({ where: { email: { endsWith: ".test" } }, select: { id: true } });
  const ids = demoUsers.map((u) => u.id);
  const finders = await db.finderProfile.findMany({ where: { userId: { in: ids } }, select: { id: true } });
  const fids = finders.map((f) => f.id);
  const businesses = await db.business.findMany({ where: { email: { endsWith: ".test" } }, select: { id: true } });
  const bids = businesses.map((b) => b.id);
  const leads = await db.lead.findMany({ where: { OR: [{ finderId: { in: fids } }, { campaign: { businessId: { in: bids } } }] }, select: { id: true, customerId: true } });
  const lids = leads.map((l) => l.id);
  await db.ledgerEntry.deleteMany({ where: { OR: [{ finderId: { in: fids } }, { leadId: { in: lids } }] } });
  await db.payout.deleteMany({ where: { finderId: { in: fids } } });
  await db.lead.deleteMany({ where: { id: { in: lids } } });
  await db.invoice.deleteMany({ where: { businessId: { in: bids } } });
  await db.customer.deleteMany({ where: { email: { endsWith: ".test" } } });
  await db.business.deleteMany({ where: { id: { in: bids } } });
  await db.finderProfile.deleteMany({ where: { id: { in: fids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
}

async function user(email: string, name: string, roles: ("FINDER" | "BUSINESS" | "ADMIN")[], extra: Record<string, unknown> = {}) {
  return db.user.create({ data: { email, name, roles, emailVerified: new Date(), ...extra } });
}

interface DemoBusiness {
  name: string;
  slug: string;
  city: string;
  postcode: string;
  description: string;
  campaign: { title: string; description: string; target: string; feeType: FeeType; pct?: number; fixed?: number; tiers?: { fromCents: number; feeCents: number }[]; minJob?: number; budget?: number; region: string };
  status?: "ACTIVE" | "PENDING_REVIEW";
  boost?: { cents: number; label: string };
}

const BUSINESSES: DemoBusiness[] = [
  {
    name: "Schildersbedrijf Kwast & Co (demo)", slug: "schilders", city: "Naaldwijk", postcode: "2671 AB",
    description: "Fictief demobedrijf. Binnen- en buitenschilderwerk voor particulieren in het Westland, sinds 1998.",
    campaign: { title: "Buitenschilderwerk in het Westland", description: "Kozijnen, dakgoten, boeidelen en gevels. Vaste prijs na opname.", target: "Huiseigenaren in Westland die binnen 3 maanden willen schilderen", feeType: "PERCENTAGE", pct: 800, region: "Westland" },
    boost: { cents: 10_000, label: "+ € 100 deze week" },
  },
  {
    name: "Autohuis Voorbeeldlaan (demo)", slug: "autodealers", city: "Delft", postcode: "2611 AA",
    description: "Fictief demobedrijf. Jonge occasions met garantie, inruil mogelijk.",
    campaign: { title: "Occasions met 12 maanden garantie", description: "Ruim 80 occasions op voorraad. Bekijk het aanbod via de link.", target: "Mensen die binnen 2 maanden een auto tot € 25.000 zoeken", feeType: "FIXED", fixed: 25_000, minJob: 300_000, region: "Delft en omstreken" },
  },
  {
    name: "Rijschool Groen Licht (demo)", slug: "rijscholen", city: "Den Haag", postcode: "2511 AA",
    description: "Fictief demobedrijf. Rijlessen met hoog slagingspercentage, ook spoedcursussen.",
    campaign: { title: "Rijlespakketten in Den Haag", description: "Pakketten vanaf 20 lessen inclusief examen.", target: "Jongeren van 17+ die willen beginnen met rijles", feeType: "FIXED", fixed: 15_000, minJob: 100_000, budget: 150_000, region: "Den Haag" },
  },
  {
    name: "Zonnig Dak Installaties (demo)", slug: "zonnepanelen", city: "Rotterdam", postcode: "3011 AA",
    description: "Fictief demobedrijf. Zonnepanelen en thuisbatterijen, eigen monteurs.",
    campaign: { title: "Zonnepanelen voor rijtjeshuizen", description: "Complete installatie binnen 6 weken, inclusief omvormer.", target: "Huiseigenaren met een zuid-, oost- of westdak", feeType: "TIERED", tiers: [{ fromCents: 300_000, feeCents: 20_000 }, { fromCents: 1_000_000, feeCents: 35_000 }], minJob: 300_000, region: "Rotterdam en Zuid-Holland" },
  },
  {
    name: "Keukenatelier Proefhuis (demo)", slug: "keukens", city: "Zoetermeer", postcode: "2711 AA",
    description: "Fictief demobedrijf. Keukens op maat uit eigen werkplaats.",
    campaign: { title: "Maatwerkkeukens", description: "Ontwerp, productie en montage in eigen beheer.", target: "Mensen die verhuizen of hun keuken vervangen", feeType: "TIERED", tiers: [{ fromCents: 500_000, feeCents: 15_000 }, { fromCents: 1_000_000, feeCents: 30_000 }, { fromCents: 2_000_000, feeCents: 50_000 }], minJob: 500_000, region: "Zoetermeer en Den Haag" },
  },
  {
    name: "Hovenier Testtuin (demo)", slug: "hoveniers", city: "Leiden", postcode: "2311 AA",
    description: "Fictief demobedrijf, wacht op goedkeuring.",
    campaign: { title: "Tuinaanleg en bestrating", description: "Van ontwerp tot oplevering.", target: "Huiseigenaren met een tuin die opnieuw aangelegd moet worden", feeType: "PERCENTAGE", pct: 700, region: "Leiden" },
    status: "PENDING_REVIEW",
  },
];

async function main() {
  await categories();
  await wipeDemo();

  await user("admin@findersarmy.test", "Admin (demo)", ["ADMIN"], { adminRole: "SUPER_ADMIN" });
  await user("support@findersarmy.test", "Support (demo)", ["ADMIN"], { adminRole: "SUPPORT" });

  const campaigns: { id: string; businessId: string; rule: Parameters<typeof calculateFee>[0]["rule"] }[] = [];
  for (const [i, b] of BUSINESSES.entries()) {
    const owner = await user(`bedrijf${i + 1}@findersarmy.test`, `Eigenaar ${i + 1} (demo)`, ["BUSINESS"]);
    const category = await db.category.findUniqueOrThrow({ where: { slug: b.slug } });
    const business = await db.business.create({
      data: {
        name: b.name, kvk: `000000${String(i + 10).padStart(2, "0")}`, vatNumber: `NL0000000${String(i + 10).padStart(2, "0")}B01`,
        street: "Demostraat", houseNumber: String(i + 1), postcode: b.postcode, city: b.city, contactName: `Eigenaar ${i + 1}`,
        phone: `+3110000000${i}`, email: `bedrijf${i + 1}@findersarmy.test`, description: b.description, website: "https://example.com",
        categoryId: category.id, serviceArea: { type: "radius", city: b.city, km: 25 }, status: b.status ?? "ACTIVE",
        termsAcceptedAt: ago(30), approvedAt: b.status ? null : ago(29), members: { create: { userId: owner.id, role: "OWNER" } },
      },
    });
    const c = b.campaign;
    const campaign = await db.campaign.create({
      data: {
        businessId: business.id, title: c.title, description: c.description, targetCustomer: c.target, feeType: c.feeType,
        feePercentBps: c.pct ?? null, feeFixedCents: c.fixed ?? null, tiers: c.tiers ?? undefined, minJobAmountCents: c.minJob ?? 50_000,
        minFeeCents: 5_000, monthlyBudgetCents: c.budget ?? null, region: c.region, status: b.status ? "DRAFT" : "LIVE",
      },
    });
    if (b.boost) {
      await db.boost.create({ data: { campaignId: campaign.id, extraFeeCents: b.boost.cents, label: b.boost.label, startsAt: ago(1), endsAt: new Date(Date.now() + 6 * DAY) } });
    }
    campaigns.push({ id: campaign.id, businessId: business.id, rule: { feeType: c.feeType, feePercentBps: c.pct, feeFixedCents: c.fixed, tiers: c.tiers, minJobAmountCents: c.minJob ?? 50_000, minFeeCents: 5_000 } });
  }

  const finders = [];
  for (const [i, f] of [
    { name: "Finder Een (demo)", city: "Naaldwijk", nickname: "Kwartiermaker" },
    { name: "Finder Twee (demo)", city: "Delft", nickname: "Verkenner" },
    { name: "Finder Drie (demo)", city: "Den Haag", nickname: null },
  ].entries()) {
    const u = await user(`finder${i + 1}@findersarmy.test`, f.name, ["FINDER"], { phone: `+3160000000${i}` });
    const p = await db.finderProfile.create({
      data: {
        userId: u.id, birthDate: new Date("1999-05-01"), city: f.city, inviteCode: `demo${i + 1}invite`, termsAcceptedAt: ago(20),
        nickname: f.nickname, leaderboardOptIn: Boolean(f.nickname), iban: i === 0 ? "NL91ABNA0417164300" : null, ibanHolder: i === 0 ? f.name : null,
        referredByFinderId: i === 2 ? undefined : undefined,
      },
    });
    finders.push(p);
  }

  // Referral links: every demo Finder has a link for the first three campaigns.
  const links = [];
  for (const f of finders) {
    for (const [j, c] of campaigns.slice(0, 3).entries()) {
      links.push(await db.referralLink.create({ data: { code: `demo${f.inviteCode.slice(4, 5)}${j}`, finderId: f.id, campaignId: c.id, clicks: 3 + j } }));
    }
  }

  // A handful of leads in different states, with consistent fee and ledger rows.
  const customerSpecs = [
    { first: "Klant", last: "Nieuw", status: "NEW" as const, days: 1 },
    { first: "Klant", last: "Gebeld", status: "CONTACTED" as const, days: 4 },
    { first: "Klant", last: "Offerte", status: "QUOTE_SENT" as const, days: 7 },
    { first: "Klant", last: "Gewonnen", status: "WON" as const, days: 10, deal: 420_000 },
    { first: "Klant", last: "Verloren", status: "LOST" as const, days: 12 },
  ];
  const finder = finders[0]!;
  const campaign = campaigns[0]!;
  for (const [i, spec] of customerSpecs.entries()) {
    const customer = await db.customer.create({
      data: { firstName: spec.first, lastName: spec.last, email: `klant${i + 1}@findersarmy.test`, phone: `+3165000000${i}`, postcode: "2671 AB", houseNumber: String(10 + i), city: "Naaldwijk", consentAt: ago(spec.days), originalFinderId: finder.id, attributionExpiresAt: new Date(Date.now() + 360 * DAY) },
    });
    const lead = await db.lead.create({
      data: {
        customerId: customer.id, campaignId: campaign.id, finderId: finder.id, referralLinkId: links[0]!.id,
        description: "Buitenkozijnen en dakgoten schilderen, rijtjeshuis uit 1985 (demo-aanvraag).", timeframe: "3_MONTHS",
        status: spec.status, createdAt: ago(spec.days), respondedAt: spec.status === "NEW" ? null : ago(spec.days - 0.5),
        dealAmountCents: spec.deal ?? null, wonAt: spec.deal ? ago(2) : null, lostReason: spec.status === "LOST" ? "PRICE" : null,
      },
    });
    await db.leadEvent.create({ data: { leadId: lead.id, toStatus: "NEW", actorType: "CUSTOMER", createdAt: ago(spec.days) } });
    if (spec.status !== "NEW") await db.leadEvent.create({ data: { leadId: lead.id, fromStatus: "NEW", toStatus: spec.status, actorType: "BUSINESS", createdAt: ago(spec.days - 0.5) } });
    if (spec.deal) {
      const share = rankFor(finder.paidDeals).shareBps;
      const fee = calculateFee({ rule: campaign.rule, dealAmountCents: spec.deal, finderShareBps: share });
      await db.fee.create({ data: { leadId: lead.id, totalCents: fee.totalCents, finderCents: fee.finderCents, platformCents: fee.platformCents, customerBonusCents: 0, calculatedWith: { seed: true, finderShareBps: share } } });
      await db.ledgerEntry.create({ data: { finderId: finder.id, leadId: lead.id, type: "EXPECTED", amountCents: fee.finderCents, note: "fee" } });
    }
  }

  console.log("Seed complete. Demo logins (magic link via dev mailbox):");
  console.log("  admin@findersarmy.test  · bedrijf1@findersarmy.test  · finder1@findersarmy.test");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
