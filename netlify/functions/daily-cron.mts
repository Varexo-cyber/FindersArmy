/**
 * Netlify Scheduled Function: runs the daily jobs (reminders, confirmations, payout checks,
 * anonymisation) every morning at 06:00 UTC by calling the protected cron route.
 */
export default async function dailyCron(): Promise<Response> {
  const base = process.env.URL ?? process.env.APP_URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) return new Response("URL or CRON_SECRET missing", { status: 500 });
  const res = await fetch(`${base}/api/cron/daily`, { headers: { authorization: `Bearer ${secret}` } });
  return new Response(await res.text(), { status: res.status });
}

export const config = { schedule: "0 6 * * *" };
