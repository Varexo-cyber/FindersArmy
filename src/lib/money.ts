/**
 * Money helpers. Every amount in FindersArmy is an integer number of cents.
 * Floats never touch money: rates are basis points (1% = 100 bps) and every
 * multiplication rounds exactly once, with an explicit rounding rule.
 */

export type Cents = number;

export function assertCents(value: number, label = "amount"): asserts value is Cents {
  if (!Number.isSafeInteger(value)) {
    throw new Error(`${label} must be an integer number of cents, got ${value}`);
  }
}

/** Multiply cents by basis points, rounding half away from zero (commercial rounding). */
export function applyBps(cents: Cents, bps: number): Cents {
  assertCents(cents, "cents");
  if (!Number.isInteger(bps)) throw new Error(`bps must be an integer, got ${bps}`);
  const product = cents * bps;
  const sign = product < 0 ? -1 : 1;
  const abs = Math.abs(product);
  const quotient = Math.floor(abs / 10_000);
  const remainder = abs % 10_000;
  return sign * (remainder * 2 >= 10_000 ? quotient + 1 : quotient);
}

/** Parse a user-typed euro amount ("1.250,50", "1250.5", "€ 1 250") into cents. */
export function parseEuroToCents(input: string): Cents | null {
  const cleaned = input.replace(/[€\s]/g, "").trim();
  if (!cleaned) return null;
  let normalized = cleaned;
  if (cleaned.includes(",")) {
    // Dutch notation: dots are thousand separators, comma is the decimal mark.
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if ((cleaned.match(/\./g) ?? []).length > 1) {
    normalized = cleaned.replace(/\./g, "");
  } else if (/^\d{1,3}\.\d{3}$/.test(cleaned)) {
    normalized = cleaned.replace(".", "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function formatCents(cents: Cents, locale = "nl", currency = "EUR"): string {
  const formatted = new Intl.NumberFormat(locale === "en" ? "en-IE" : "nl-NL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
  // Normalise "€ 150,00" spacing (Intl uses a no-break space) for consistent mono alignment.
  return formatted.replace(/ /g, " ");
}

/** Whole-euro formatting for headline numbers like "Verdien tot € 240". */
export function formatEuroShort(cents: Cents, locale = "nl"): string {
  const hasCents = cents % 100 !== 0;
  return new Intl.NumberFormat(locale === "en" ? "en-IE" : "nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  })
    .format(cents / 100)
    .replace(/ /g, " ");
}

export function sumCents(values: Cents[]): Cents {
  return values.reduce((acc, v) => acc + v, 0);
}
