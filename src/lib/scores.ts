/**
 * Quality scores, 0–100. With too little data a score is 100: new participants are not punished
 * for having no history, but they also cannot hide behind it for long (minimum samples are small).
 */

export interface BusinessScoreInput {
  /** Leads old enough to have needed a response: whether each got CONTACTED within the window. */
  respondedInTime: boolean[];
  /** Leads older than 14 days: whether the business moved them past NEW. */
  updated: boolean[];
  /** Invoices that are due or paid: whether each was paid on time. */
  paidOnTime: boolean[];
}

const ratio = (xs: boolean[], min: number) => (xs.length < min ? 1 : xs.filter(Boolean).length / xs.length);

export function businessScore(input: BusinessScoreInput): number {
  const response = ratio(input.respondedInTime, 3);
  const updates = ratio(input.updated, 3);
  const payment = ratio(input.paidOnTime, 1);
  return Math.round(100 * (0.4 * response + 0.3 * updates + 0.3 * payment));
}

export interface FinderScoreInput {
  /** Outcome of every lead that reached a verdict: true when marked spam/nonsense. */
  spamFlags: boolean[];
}

export function finderScore(input: FinderScoreInput): number {
  if (input.spamFlags.length < 5) return 100;
  const bad = input.spamFlags.filter(Boolean).length / input.spamFlags.length;
  return Math.round(100 * (1 - bad));
}

export type FinderStanding = "ACTIVE" | "WARNED" | "SUSPENDED";

export function finderStanding(score: number, warnBelow: number, suspendBelow: number): FinderStanding {
  if (score < suspendBelow) return "SUSPENDED";
  if (score < warnBelow) return "WARNED";
  return "ACTIVE";
}
