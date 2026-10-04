import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { assistantEnabled, claudeAnswer, offlineAnswer, textStream } from "@/lib/server/assistant";
import { rateLimit } from "@/lib/server/rate-limit";
import { requestFingerprint } from "@/lib/server/hash";

export const maxDuration = 60;

const body = z.object({
  locale: z.enum(["nl", "en"]).default("nl"),
  page: z.string().max(300).default("/"),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20)
    .refine((m) => m.at(-1)?.role === "user", "last message must be from the user"),
});

export async function POST(req: NextRequest) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "INVALID" }, { status: 400 });
  const { ipHash } = await requestFingerprint();
  if (!(await rateLimit("assistant", ipHash, 30, "10 m")).ok) {
    return new NextResponse(parsed.data.locale === "en" ? "You're asking a lot at once. Try again in a few minutes." : "Even rustig aan: probeer het over een paar minuten opnieuw.", { status: 429 });
  }
  const { locale, page, messages } = parsed.data;
  const stream = assistantEnabled()
    ? await claudeAnswer(locale, messages, page)
    : textStream(await offlineAnswer(locale, messages.at(-1)!.content));
  return new NextResponse(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-assistant-mode": assistantEnabled() ? "claude" : "offline" },
  });
}
