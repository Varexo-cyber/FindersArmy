import { describe, expect, it } from "vitest";
import { formatIban, isValidIban, maskIban } from "@/lib/iban";
import { isValidDutchPostcode, isValidKvk, isValidPhone, isValidVatNumber, normalizePhone, normalizePostcode } from "@/lib/kvk";

describe("IBAN", () => {
  it.each(["NL91ABNA0417164300", "nl91 abna 0417 1643 00", "BE68539007547034", "DE89370400440532013000"])(
    "accepts %s",
    (iban) => expect(isValidIban(iban)).toBe(true),
  );
  it.each(["NL91ABNA0417164301", "NL91ABNA041716430", "XX91ABNA0417164300", "", "NL00"])("rejects %s", (iban) =>
    expect(isValidIban(iban)).toBe(false),
  );
  it("formats and masks", () => {
    expect(formatIban("nl91abna0417164300")).toBe("NL91 ABNA 0417 1643 00");
    expect(maskIban("NL91ABNA0417164300")).toBe("NL91 •••• •••• 4300");
  });
});

describe("KvK, VAT, postcode, phone", () => {
  it("validates KvK as 8 digits", () => {
    expect(isValidKvk("12345678")).toBe(true);
    expect(isValidKvk("1234 5678")).toBe(true);
    expect(isValidKvk("1234567")).toBe(false);
    expect(isValidKvk("123456789")).toBe(false);
    expect(isValidKvk("1234567a")).toBe(false);
  });
  it("validates Dutch VAT numbers", () => {
    expect(isValidVatNumber("NL123456789B01")).toBe(true);
    expect(isValidVatNumber("nl 1234.56789 b01")).toBe(true);
    expect(isValidVatNumber("NL123456789")).toBe(false);
  });
  it("normalises postcodes", () => {
    expect(normalizePostcode("2671ab")).toBe("2671 AB");
    expect(isValidDutchPostcode("2671 AB")).toBe(true);
    expect(isValidDutchPostcode("0671 AB")).toBe(false);
  });
  it("normalises phone numbers", () => {
    expect(normalizePhone("06-12345678")).toBe("+31612345678");
    expect(normalizePhone("0031 6 1234 5678")).toBe("+31612345678");
    expect(isValidPhone("0174 123456")).toBe(true);
    expect(isValidPhone("123")).toBe(false);
  });
});
