import { describe, expect, it } from "vitest";
import { applyBps, formatCents, formatEuroShort, parseEuroToCents } from "@/lib/money";
import { calculateVat, vatRateFor } from "@/lib/vat";

describe("applyBps", () => {
  it("rounds half away from zero", () => {
    expect(applyBps(1, 5000)).toBe(1); // 0.5 → 1
    expect(applyBps(-1, 5000)).toBe(-1);
    expect(applyBps(3, 3333)).toBe(1); // 0.9999
    expect(applyBps(10_000, 2100)).toBe(2_100);
  });
  it("rejects non-integers", () => {
    expect(() => applyBps(1.5, 100)).toThrow();
    expect(() => applyBps(100, 1.5)).toThrow();
  });
});

describe("parseEuroToCents", () => {
  it.each([
    ["1.250,50", 125_050],
    ["1250.5", 125_050],
    ["€ 1 250", 125_000],
    ["1.250", 125_000],
    ["12.500.000", 1_250_000_000],
    ["0,01", 1],
    ["150", 15_000],
  ])("parses %s", (input, cents) => expect(parseEuroToCents(input)).toBe(cents));

  it.each(["", "abc", "1,234,5", "-5", "1.2.3,4,5"])("rejects %s", (input) =>
    expect(parseEuroToCents(input)).toBeNull(),
  );
});

describe("formatting", () => {
  it("formats Dutch currency", () => {
    expect(formatCents(15_000)).toBe("€ 150,00");
    expect(formatCents(123_456_7)).toBe("€ 12.345,67");
    expect(formatEuroShort(24_000)).toBe("€ 240");
  });
});

describe("VAT", () => {
  it("uses 21% for NL", () => {
    expect(vatRateFor("nl")).toBe(2100);
    expect(calculateVat(24_000, 2100)).toEqual({ subtotalCents: 24_000, vatRateBps: 2100, vatCents: 5_040, totalCents: 29_040 });
  });
  it("rounds VAT on cents", () => {
    expect(calculateVat(5_001, 2100).vatCents).toBe(1_050); // 1050.21
  });
  it("refuses unknown countries rather than guessing a rate", () => {
    expect(() => vatRateFor("XX")).toThrow();
  });
});
