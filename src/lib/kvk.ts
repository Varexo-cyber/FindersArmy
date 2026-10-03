export function normalizeKvk(input: string): string {
  return input.replace(/\D/g, "");
}

/** KvK numbers are exactly 8 digits. The KvK has no public checksum, so format is all we check. */
export function isValidKvk(input: string): boolean {
  return /^\d{8}$/.test(input.replace(/[\s.]/g, ""));
}

/** Dutch VAT numbers: NL + 9 digits + B + 2 digits. Other EU formats are accepted loosely. */
export function isValidVatNumber(input: string): boolean {
  const v = input.replace(/[\s.]/g, "").toUpperCase();
  if (v.startsWith("NL")) return /^NL\d{9}B\d{2}$/.test(v);
  if (v.startsWith("BE")) return /^BE[01]\d{9}$/.test(v);
  return /^[A-Z]{2}[A-Z0-9]{8,12}$/.test(v);
}

export function normalizeVatNumber(input: string): string {
  return input.replace(/[\s.]/g, "").toUpperCase();
}

export function normalizePostcode(input: string): string {
  const v = input.replace(/\s/g, "").toUpperCase();
  return /^\d{4}[A-Z]{2}$/.test(v) ? `${v.slice(0, 4)} ${v.slice(4)}` : v;
}

export function isValidDutchPostcode(input: string): boolean {
  return /^[1-9]\d{3}\s?[A-Za-z]{2}$/.test(input.trim());
}

export function normalizePhone(input: string): string {
  let v = input.replace(/[\s\-().]/g, "");
  if (v.startsWith("00")) v = `+${v.slice(2)}`;
  if (v.startsWith("06")) v = `+316${v.slice(2)}`;
  else if (v.startsWith("0")) v = `+31${v.slice(1)}`;
  return v;
}

export function isValidPhone(input: string): boolean {
  return /^\+\d{9,15}$/.test(normalizePhone(input));
}
