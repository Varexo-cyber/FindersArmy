import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

/** Open Graph images in house style: paper background, ink type, one signal bar. */
export async function GET(req: NextRequest) {
  const title = (req.nextUrl.searchParams.get("title") ?? "Je kent iemand. Verdien eraan.").slice(0, 110);
  const locale = req.nextUrl.searchParams.get("locale") === "en" ? "en" : "nl";
  const amount = req.nextUrl.searchParams.get("amount");
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F5F3EE", padding: 72, color: "#0E0F0C", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="56" height="56" viewBox="0 0 32 32">
            <rect x="1" y="1" width="30" height="30" rx="3" fill="#0E0F0C" />
            <path d="M8 13.5L16 8.5L24 13.5" stroke="#F5F3EE" strokeWidth="2.6" fill="none" />
            <path d="M8 20L16 15L24 20" stroke="#F5F3EE" strokeWidth="2.6" fill="none" />
            <rect x="8" y="23" width="16" height="2.4" fill="#D4FF3F" />
          </svg>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1.5 }}>FindersArmy</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {amount ? (
            <div style={{ display: "flex", alignSelf: "flex-start", background: "#D4FF3F", padding: "6px 16px", fontSize: 64, fontFamily: "monospace", fontWeight: 700 }}>{amount}</div>
          ) : null}
          <div style={{ fontSize: title.length > 60 ? 64 : 84, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>{title}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: "#6B6E66", borderTop: "2px solid #E2DFD7", paddingTop: 24 }}>
          <span>{locale === "en" ? "Only pay for results." : "Betaal alleen bij resultaat."}</span>
          <span>findersarmy.com</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
