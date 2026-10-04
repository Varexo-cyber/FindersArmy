import { describe, expect, it } from "vitest";
import { campaignSchema } from "@/lib/validation/campaign";
import { businessSignupSchema } from "@/lib/validation/business";

const campaign = {
  title: "Buitenschilderwerk",
  description: "Kozijnen en gevels",
  targetCustomer: "Huiseigenaren",
  region: "Westland",
  feeType: "PERCENTAGE" as const,
  percent: "7,5",
  minJob: "500",
  minFee: "50",
};

describe("campaignSchema", () => {
  it("converts human input to cents and basis points", () => {
    const r = campaignSchema.parse(campaign);
    expect(r).toMatchObject({ feePercentBps: 750, minJobAmountCents: 50_000, minFeeCents: 5_000, monthlyBudgetCents: null });
  });

  it("defaults minimums to € 500 and € 50", () => {
    const r = campaignSchema.parse({ ...campaign, minJob: "", minFee: "" });
    expect(r.minJobAmountCents).toBe(50_000);
    expect(r.minFeeCents).toBe(5_000);
  });

  it("parses tiers", () => {
    const r = campaignSchema.parse({ ...campaign, feeType: "TIERED", tiers: [{ from: "500", fee: "100" }, { from: "10.000", fee: "250" }] });
    expect(r.tiers).toEqual([{ fromCents: 50_000, feeCents: 10_000 }, { fromCents: 1_000_000, feeCents: 25_000 }]);
  });

  it("rejects missing or absurd fee values", () => {
    expect(campaignSchema.safeParse({ ...campaign, percent: "80" }).success).toBe(false);
    expect(campaignSchema.safeParse({ ...campaign, feeType: "FIXED", fixed: "" }).success).toBe(false);
    expect(campaignSchema.safeParse({ ...campaign, feeType: "TIERED", tiers: [] }).success).toBe(false);
  });
});

describe("businessSignupSchema", () => {
  const valid = {
    company: {
      name: "Testbedrijf", kvk: "12345678", vatNumber: "NL123456789B01", street: "Straat", houseNumber: "1",
      postcode: "2671ab", city: "Naaldwijk", contactName: "Jan", phone: "0612345678", email: "INFO@Test.nl",
      website: "", description: "Wij schilderen huizen in het Westland al jaren.",
    },
    categoryId: "c1",
    serviceArea: { type: "postcodes" as const, prefixes: "2671, 2672" },
    campaign,
    terms: true as const,
  };

  it("normalises company data", () => {
    const r = businessSignupSchema.parse(valid);
    expect(r.company.postcode).toBe("2671 AB");
    expect(r.company.phone).toBe("+31612345678");
    expect(r.company.email).toBe("info@test.nl");
    expect(r.serviceArea).toEqual({ type: "postcodes", prefixes: ["2671", "2672"] });
  });

  it("requires terms and a valid KvK", () => {
    expect(businessSignupSchema.safeParse({ ...valid, terms: false }).success).toBe(false);
    expect(businessSignupSchema.safeParse({ ...valid, company: { ...valid.company, kvk: "123" } }).success).toBe(false);
  });
});
