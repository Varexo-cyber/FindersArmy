import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { runDailyJobs } from "@/lib/server/services/jobs";
import { withTimeTravel } from "@/lib/server/clock";

export const maxDuration = 300;

/** Called by Vercel Cron (see vercel.json) with `Authorization: Bearer $CRON_SECRET`. */
export async function GET(req: NextRequest) {
  const secret = env().CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  // E2E builds may simulate elapsed days to exercise reminders and confirmation mails.
  const days = process.env.E2E === "1" ? Number(req.nextUrl.searchParams.get("offsetDays") ?? 0) : 0;
  const results = days > 0 ? await withTimeTravel(days, runDailyJobs) : await runDailyJobs();
  console.info(JSON.stringify({ event: "cron_daily", results }));
  return NextResponse.json({ ok: true, results });
}
