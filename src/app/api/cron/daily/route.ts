import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { runDailyJobs } from "@/lib/server/services/jobs";

export const maxDuration = 300;

/** Called by Vercel Cron (see vercel.json) with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const secret = env().CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const results = await runDailyJobs();
  console.info(JSON.stringify({ event: "cron_daily", results }));
  return NextResponse.json({ ok: true, results });
}
