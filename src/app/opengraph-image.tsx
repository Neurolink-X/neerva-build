import { ImageResponse } from "next/og";

export const alt = "NEERVA BUILD — Build better. Buy smarter.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 68, background: "#f5f4ef", color: "#26382e", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 27, letterSpacing: 5, fontWeight: 700 }}>
        <div style={{ display: "flex", width: 54, height: 54, alignItems: "center", justifyContent: "center", borderRadius: 14, background: "#d55d36", color: "white", fontSize: 34 }}>N</div>
        NEERVA BUILD
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 72, lineHeight: 1.04, fontWeight: 600 }}><span>Build better.</span><span style={{ color: "#d55d36" }}>Buy smarter.</span></div>
        <div style={{ maxWidth: 820, color: "#687268", fontSize: 27 }}>Construction materials, dealer quotations and home planning in one place.</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#687268", fontSize: 20 }}><span>India-first construction marketplace</span><span>Kanpur · open to other cities</span></div>
    </div>,
    { ...size },
  );
}
