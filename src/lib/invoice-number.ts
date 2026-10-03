/** Invoice numbers are sequential per year and never reused: FA-2026-00001. */
export function formatInvoiceNumber(year: number, sequence: number): string {
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > 99_999) throw new Error(`Invoice sequence out of range: ${sequence}`);
  return `FA-${year}-${String(sequence).padStart(5, "0")}`;
}
