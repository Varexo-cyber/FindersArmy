"use server";

import { cookies } from "next/headers";
import { leadSchema } from "@/lib/validation/lead";
import { flattenErrors, type FieldErrors } from "@/lib/validation/common";
import { db } from "../db";
import { requestFingerprint } from "../hash";
import { rateLimit } from "../rate-limit";
import { storeImage } from "../storage";
import { createLead, LeadError } from "../services/leads";

export type LeadResult = { ok: true; kind: "created" | "duplicate"; business: string } | { ok: false; error?: string; errors?: FieldErrors };

/** Resolve which link gets the credit: the earliest-visited link for the same campaign wins. */
async function attributedCode(code: string): Promise<string> {
  const link = await db.referralLink.findUnique({ where: { code } });
  if (!link) return code;
  const visited = ((await cookies()).get("fa_ref")?.value ?? "").split(".").filter(Boolean);
  for (const c of visited) {
    if (c === code) break;
    const earlier = await db.referralLink.findUnique({ where: { code: c } });
    if (earlier && earlier.campaignId === link.campaignId) return earlier.code;
  }
  return code;
}

export async function submitLead(code: string, formData: FormData): Promise<LeadResult> {
  const { ipHash, uaHash } = await requestFingerprint();
  const limited = await rateLimit("lead-submit", ipHash, 5, "1 h");
  if (!limited.ok) return { ok: false, error: "RATE_LIMIT" };

  const raw = Object.fromEntries(["firstName", "lastName", "phone", "email", "postcode", "houseNumber", "city", "description", "timeframe", "website"].map((k) => [k, String(formData.get(k) ?? "")]));
  const parsed = leadSchema.safeParse({ ...raw, consent: formData.get("consent") === "on" });
  if (!parsed.success) return { ok: false, errors: flattenErrors(parsed.error) };
  if (parsed.data.website) return { ok: true, kind: "created", business: "" };

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0).slice(0, 4);
  const photoUrls: string[] = [];
  for (const p of photos) {
    try {
      photoUrls.push(await storeImage(p, "leads"));
    } catch {
      return { ok: false, error: "FILE" };
    }
  }

  try {
    const res = await createLead({ ...parsed.data, code: await attributedCode(code), photoUrls, ipHash, uaHash });
    return { ok: true, kind: res.kind, business: res.business };
  } catch (e) {
    if (e instanceof LeadError) return { ok: false, error: e.code };
    throw e;
  }
}
