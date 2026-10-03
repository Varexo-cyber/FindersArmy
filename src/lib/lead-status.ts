/**
 * Lead pipeline.
 *   NEW → CONTACTED → QUOTE_SENT → WON → COMPLETED → CONFIRMED → INVOICED → PAID → PAID_OUT
 * Side paths: LOST (reason required), DISPUTED, DUPLICATE, FRAUD.
 *
 * Businesses move leads forward up to COMPLETED (or LOST). Everything after that is driven by
 * the customer confirmation, invoicing and payment — never by a business clicking a button.
 */
export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTE_SENT",
  "WON",
  "COMPLETED",
  "CONFIRMED",
  "INVOICED",
  "PAID",
  "PAID_OUT",
  "LOST",
  "DISPUTED",
  "DUPLICATE",
  "FRAUD",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const PIPELINE: LeadStatus[] = ["NEW", "CONTACTED", "QUOTE_SENT", "WON", "COMPLETED", "CONFIRMED", "INVOICED", "PAID", "PAID_OUT"];

export const LOST_REASONS = ["PRICE", "CHOSE_COMPETITOR", "NO_RESPONSE", "NOT_NEEDED", "OUT_OF_AREA", "SPAM", "OTHER"] as const;
export type LostReason = (typeof LOST_REASONS)[number];

const BUSINESS_TRANSITIONS: Partial<Record<LeadStatus, LeadStatus[]>> = {
  NEW: ["CONTACTED", "QUOTE_SENT", "WON", "LOST"],
  CONTACTED: ["QUOTE_SENT", "WON", "LOST"],
  QUOTE_SENT: ["WON", "LOST"],
  WON: ["COMPLETED", "LOST"],
};

export function businessCanTransition(from: LeadStatus, to: LeadStatus): boolean {
  return BUSINESS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function businessNextStatuses(from: LeadStatus): LeadStatus[] {
  return BUSINESS_TRANSITIONS[from] ?? [];
}

/** Statuses in which a deal amount exists and a fee is (provisionally) owed. */
export const FEE_BEARING: LeadStatus[] = ["WON", "COMPLETED", "CONFIRMED", "INVOICED", "PAID", "PAID_OUT"];

/** Statuses in which the customer may still confirm the job. */
export const CONFIRMABLE: LeadStatus[] = ["WON", "COMPLETED", "CONFIRMED", "INVOICED", "PAID", "PAID_OUT"];

export function isClosed(status: LeadStatus): boolean {
  return ["PAID_OUT", "LOST", "DUPLICATE", "FRAUD"].includes(status);
}

/** Position in the main pipeline, for the Finder's timeline. Side paths return -1. */
export function pipelineIndex(status: LeadStatus): number {
  return PIPELINE.indexOf(status);
}

export interface TransitionInput {
  from: LeadStatus;
  to: LeadStatus;
  dealAmountCents?: number | null;
  lostReason?: string | null;
}

export type TransitionError = "NOT_ALLOWED" | "DEAL_AMOUNT_REQUIRED" | "LOST_REASON_REQUIRED";

export function validateBusinessTransition(input: TransitionInput): TransitionError | null {
  if (!businessCanTransition(input.from, input.to)) return "NOT_ALLOWED";
  if (input.to === "WON" && (input.dealAmountCents == null || !Number.isSafeInteger(input.dealAmountCents) || input.dealAmountCents <= 0)) {
    return "DEAL_AMOUNT_REQUIRED";
  }
  if (input.to === "LOST" && !input.lostReason) return "LOST_REASON_REQUIRED";
  return null;
}
