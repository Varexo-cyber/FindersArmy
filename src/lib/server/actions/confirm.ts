"use server";

import { z } from "zod";
import { customerRespond } from "../services/leads";
import { parseEuroToCents } from "../../money";
import { rateLimit } from "../rate-limit";
import { requestFingerprint } from "../hash";

const input = z.object({
  token: z.string().min(20).max(100),
  kind: z.enum(["confirm", "correct", "not_done"]),
  amount: z.string().optional(),
  note: z.string().max(1000).optional(),
});

export type ConfirmResult = { ok: true; outcome: "confirmed" | "disputed" | "noted" | "already"; bonusCents?: number } | { ok: false; error: string };

export async function respondToConfirmation(raw: z.input<typeof input>): Promise<ConfirmResult> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "INVALID" };
  const { ipHash } = await requestFingerprint();
  if (!(await rateLimit("confirm", ipHash, 20, "1 h")).ok) return { ok: false, error: "RATE_LIMIT" };
  const { token, kind, amount, note } = parsed.data;
  if (kind === "correct") {
    const cents = amount ? parseEuroToCents(amount) : null;
    if (!cents) return { ok: false, error: "AMOUNT" };
    const r = await customerRespond(token, { kind, amountCents: cents, note });
    return r.already ? { ok: true, outcome: "already" } : { ok: true, outcome: r.outcome, bonusCents: "bonusCents" in r ? r.bonusCents : undefined };
  }
  try {
    const r = await customerRespond(token, kind === "confirm" ? { kind } : { kind, note });
    return r.already ? { ok: true, outcome: "already" } : { ok: true, outcome: r.outcome, bonusCents: "bonusCents" in r ? r.bonusCents : undefined };
  } catch {
    return { ok: false, error: "NOT_FOUND" };
  }
}
