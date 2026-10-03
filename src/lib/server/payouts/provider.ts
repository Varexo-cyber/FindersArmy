import "server-only";

export interface PayoutInstruction {
  payoutId: string;
  amountCents: number;
  iban: string;
  holder: string;
  reference: string;
}

/**
 * How approved payouts leave the building. Phase 1 is a SEPA pain.001 file that an admin uploads
 * to the business bank. Stripe Connect or Mollie Connect can implement this same interface later
 * (returning an external transfer id instead of a file) without changing the payout workflow.
 */
export interface PayoutProvider {
  name: string;
  prepareBatch(input: { reference: string; instructions: PayoutInstruction[]; executionDate: Date }): Promise<{ artifact: string; contentType: string; filename: string }>;
}
