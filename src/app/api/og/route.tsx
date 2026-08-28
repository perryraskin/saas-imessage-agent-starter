import { ImageResponse } from "next/og";

export function GET(request: Request) {
  const url = new URL(request.url);
  const title = (url.searchParams.get("title") || "Your account is ready").slice(0, 64);
  const detail = (url.searchParams.get("detail") || "Open the exact product view").slice(0, 96);
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 70, color: "#f5f3eb", background: "#18362b", fontFamily: "sans-serif" }}>
      <div style={{ fontSize: 24, letterSpacing: 5, textTransform: "uppercase", opacity: .72 }}>SaaS Assistant</div>
      <div><div style={{ maxWidth: 900, fontSize: 72, fontWeight: 700, lineHeight: 1 }}>{title}</div><div style={{ marginTop: 28, fontSize: 32, opacity: .78 }}>{detail}</div></div>
    </div>,
    { width: 1200, height: 630 },
  );
}
