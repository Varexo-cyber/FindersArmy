import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { buildPain001, sepaText } from "@/lib/sepa";
import { formatInvoiceNumber } from "@/lib/invoice-number";

const base = {
  messageId: "FA-PAYOUT-20261003-01",
  createdAt: new Date("2026-10-03T10:00:00Z"),
  executionDate: new Date("2026-10-05T00:00:00Z"),
  debtor: { name: "FindersArmy B.V.", iban: "NL91ABNA0417164300", bic: "ABNANL2A" },
  transfers: [
    { endToEndId: "PAYOUT-cl1", amountCents: 15_000, creditorName: "Yassin El Amrani", creditorIban: "NL20INGB0001234567", remittance: "FindersArmy uitbetaling oktober" },
    { endToEndId: "PAYOUT-cl2", amountCents: 2_550, creditorName: "Zoë Müller & Søn", creditorIban: "BE68539007547034", remittance: "FindersArmy uitbetaling <test>" },
  ],
};

function hasXmllint() {
  try {
    execFileSync("xmllint", ["--version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

describe("pain.001", () => {
  it("computes control sums and transaction counts", () => {
    const xml = buildPain001(base);
    expect(xml.match(/<NbOfTxs>2<\/NbOfTxs>/g)).toHaveLength(2);
    expect(xml.match(/<CtrlSum>175.50<\/CtrlSum>/g)).toHaveLength(2);
    expect(xml).toContain('<InstdAmt Ccy="EUR">25.50</InstdAmt>');
  });

  it("reduces names to the SEPA character set", () => {
    expect(sepaText("Zoë Müller & Søn <x>", 70)).toBe("Zoe Muller + S n x");
    const xml = buildPain001(base);
    expect(xml).not.toMatch(/[ëüø]/);
    expect(xml).not.toContain("<test>");
  });

  it("refuses invalid IBANs and empty batches", () => {
    expect(() => buildPain001({ ...base, transfers: [] })).toThrow();
    expect(() => buildPain001({ ...base, transfers: [{ ...base.transfers[0]!, creditorIban: "NL00BANK0000000000" }] })).toThrow();
    expect(() => buildPain001({ ...base, transfers: [{ ...base.transfers[0]!, amountCents: 0 }] })).toThrow();
  });

  it("falls back to NOTPROVIDED when no valid BIC is configured", () => {
    const xml = buildPain001({ ...base, debtor: { ...base.debtor, bic: "XXXX" } });
    expect(xml).toContain("<Othr><Id>NOTPROVIDED</Id></Othr>");
  });

  it.runIf(hasXmllint())("validates against the official ISO 20022 XSD", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "sepa-"));
    for (const variant of [base, { ...base, debtor: { ...base.debtor, bic: null } }]) {
      const file = path.join(dir, "batch.xml");
      writeFileSync(file, buildPain001(variant));
      const xsd = path.resolve(__dirname, "../fixtures/pain.001.001.03.xsd");
      const out = execFileSync("xmllint", ["--noout", "--schema", xsd, file], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      expect(out).toBe("");
    }
  });
});

describe("invoice numbers", () => {
  it("pads per year", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("FA-2026-00001");
    expect(formatInvoiceNumber(2026, 12345)).toBe("FA-2026-12345");
    expect(() => formatInvoiceNumber(2026, 0)).toThrow();
  });
});
