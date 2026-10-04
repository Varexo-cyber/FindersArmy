import { describe, expect, it } from "vitest";
import { excerpt, liveChunks, renderKnowledge, searchKnowledge, staticChunks } from "@/lib/assistant/knowledge";
import { DEFAULT_RANKS } from "@/lib/ranks";

const live = {
  ranks: DEFAULT_RANKS,
  customerBonusCents: 2_500,
  firstDealBonusCents: 1_000,
  inviteBonusCents: 2_500,
  payoutMinimumCents: 2_500,
  confirmationDelayDays: 14,
  invoiceDueDays: 14,
  suspendAfterDays: 21,
  responseHours: 48,
  campaigns: [{ business: "Testbedrijf (demo)", category: "Schilders", region: "Westland", earnUpToCents: 37_500, boost: null }],
};

describe("assistant knowledge", () => {
  const chunks = [...staticChunks("nl"), ...liveChunks("nl", live)];

  it("is built from the site's own content", () => {
    const text = renderKnowledge(chunks);
    expect(text).toContain("Je kent iemand.");
    expect(text).toContain("Dekvloeren");
    expect(text).toContain("Rekruut: 0+ betaalde deals, 75%");
    expect(text).toContain("Testbedrijf (demo)");
    expect(text).toContain("42042045");
  });

  it("finds the right answer offline", () => {
    expect(searchKnowledge("Wanneer krijg ik mijn geld?", chunks)[0]!.title).toBe("Wanneer krijg ik mijn geld?");
    expect(searchKnowledge("wat kost het voor een bedrijf", chunks).map((c) => c.title)).toContain("Wat kost FindersArmy?");
    expect(searchKnowledge("is dit een piramidesysteem", chunks)[0]!.title).toContain("piramide");
    expect(searchKnowledge("Hoeveel krijg ik voor zonnepanelen?", chunks).map((c) => c.id)).toContain("cat:zonnepanelen");
    expect(searchKnowledge("wat verdien ik met een autodealer", chunks)[0]!.id).toBe("cat:autodealers");
    expect(searchKnowledge("moet ik belasting betalen", chunks)[0]!.title).toContain("belasting");
  });

  it("returns nothing for empty or meaningless queries", () => {
    expect(searchKnowledge("", chunks)).toEqual([]);
    expect(searchKnowledge("de het een", chunks)).toEqual([]);
  });

  it("quotes only the relevant lines of long chunks", () => {
    const home = chunks.find((c) => c.id === "page:home")!;
    const e = excerpt(home, "calculator klusbedrag");
    expect(e.length).toBeLessThan(home.text.length);
  });

  it("has English knowledge too", () => {
    expect(renderKnowledge(staticChunks("en"))).toContain("You know someone.");
  });
});
