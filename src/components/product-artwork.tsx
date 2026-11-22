import type { ReactNode } from "react";

const palette: Record<string, { base: string; shade: string; accent: string; label: string }> = {
  steel: { base: "#8f9b96", shade: "#56655f", accent: "#c6d2cf", label: "TMT steel" },
  cement: { base: "#d7c49e", shade: "#aa936d", accent: "#f3ead8", label: "cement bag" },
  "bricks-blocks": { base: "#c98661", shade: "#985e43", accent: "#e6b08d", label: "brick and block" },
  plumbing: { base: "#d2d9d4", shade: "#87988f", accent: "#a9cbc8", label: "pipe fitting" },
  electrical: { base: "#cb5745", shade: "#812f2a", accent: "#e5c15f", label: "electrical cable" },
  aggregates: { base: "#b29c7e", shade: "#89785e", accent: "#d8c7a9", label: "construction aggregate" },
};

function Steel({ accent, shade }: { accent: string; shade: string }) {
  return <g transform="rotate(-13 260 180)"><path d="M52 112h415M48 151h415M44 190h415M40 229h415" stroke={shade} strokeWidth="20" strokeLinecap="round"/><path d="M52 107h410M48 146h410M44 185h410M40 224h410" stroke={accent} strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12"/><ellipse cx="467" cy="112" rx="12" ry="10" fill="#e8eeeb"/><ellipse cx="463" cy="151" rx="12" ry="10" fill="#e8eeeb"/><ellipse cx="459" cy="190" rx="12" ry="10" fill="#e8eeeb"/><ellipse cx="455" cy="229" rx="12" ry="10" fill="#e8eeeb"/></g>;
}
function Cement({ base, shade, accent }: { base: string; shade: string; accent: string }) {
  return <g><ellipse cx="260" cy="304" rx="145" ry="20" fill="#26382d" opacity=".08"/><path d="M157 80Q260 59 363 80l25 196q-127 33-256 0z" fill={base} stroke={shade} strokeWidth="4"/><path d="M157 80l16 29 87-11 87 11 16-29" fill={accent} stroke={shade} strokeWidth="3"/><path d="M179 137h162M187 150h148" stroke={shade} strokeWidth="5" opacity=".42"/><rect x="185" y="175" width="150" height="67" rx="5" fill={accent} opacity=".8"/><path d="M207 210h105M207 223h79" stroke={shade} strokeWidth="7" strokeLinecap="round" opacity=".55"/><path d="M172 277q87-20 191 0" stroke={shade} strokeWidth="4" fill="none"/></g>;
}
function Bricks({ base, shade, accent }: { base: string; shade: string; accent: string }) {
  return <g transform="translate(68 68)"><path d="M0 185l120-69 260 0 65 42-120 75H67z" fill={shade}/><path d="M0 185l120-69 0-64L0 120z" fill={base}/><path d="M120 116l260 0 65 42-260 0z" fill={accent}/><path d="M0 120l120-68 260 0-120 69z" fill={base}/><path d="M67 233v-65l120-69v64zM187 168h260v62H187z" fill={base}/><path d="M120 116v-64m130 64V52m130 64V52M67 168h120m-67-52v117m130-65v62m130-62v62" stroke={shade} strokeWidth="6" opacity=".65"/></g>;
}
function Pipes({ base, shade, accent }: { base: string; shade: string; accent: string }) {
  return <g><path d="M89 100h280q37 0 37 37v95" fill="none" stroke={shade} strokeWidth="76" strokeLinecap="round"/><path d="M89 100h280q37 0 37 37v95" fill="none" stroke={base} strokeWidth="61" strokeLinecap="round"/><path d="M89 100h280q37 0 37 37v95" fill="none" stroke={accent} strokeWidth="5" strokeLinecap="round" opacity=".8"/><ellipse cx="89" cy="100" rx="35" ry="38" fill="#f6f7f4" stroke={shade} strokeWidth="9"/><ellipse cx="89" cy="100" rx="20" ry="23" fill="#dce8e4" stroke={accent} strokeWidth="5"/><circle cx="405" cy="234" r="38" fill={shade}/><circle cx="405" cy="234" r="26" fill={accent}/><circle cx="405" cy="234" r="14" fill="#f6f7f4"/></g>;
}
function Electrical({ base, shade, accent }: { base: string; shade: string; accent: string }) {
  return <g><path d="M107 248q-26-38 13-69l190-123q32-22 52 9t-13 53L175 242q-35 29-68 6z" fill={shade}/><path d="M123 235q-17-26 13-47L327 65q17-12 29 6t-8 30L157 230q-19 14-34 5z" fill={base}/><path d="M147 219L337 83" stroke={accent} strokeWidth="11" strokeLinecap="round"/><path d="M110 255q62 54 152 8" fill="none" stroke={base} strokeWidth="18" strokeLinecap="round"/><path d="M127 266q55 35 111 13" fill="none" stroke={accent} strokeWidth="8" strokeLinecap="round"/></g>;
}
function Aggregate({ base, shade, accent }: { base: string; shade: string; accent: string }) {
  return <g><path d="M83 267q10-34 39-39 4-34 43-41 17-54 70-49 25-62 84-33 20-45 66-22 35 4 48 41 50 8 49 55 29 13 20 45H83z" fill={base}/><path d="M104 240q18-27 45-13m36-45q18 2 28 19m61-73q17 16 14 35m51 11q15-21 34-16m33 30q19-10 36 1m-244 58q15-16 33-10" fill="none" stroke={shade} strokeWidth="12" strokeLinecap="round"/><circle cx="216" cy="209" r="8" fill={accent}/><circle cx="343" cy="234" r="7" fill={accent}/><circle cx="289" cy="164" r="6" fill={accent}/></g>;
}

export function ProductArtwork({ category, scene = "catalog" }: { category: string; scene?: "catalog" | "detail" | "alternate" | "use" }) {
  const colors = palette[category] ?? palette.steel;
  const art: Record<string, ReactNode> = {
    steel: <Steel accent={colors.accent} shade={colors.shade} />,
    cement: <Cement base={colors.base} shade={colors.shade} accent={colors.accent} />,
    "bricks-blocks": <Bricks base={colors.base} shade={colors.shade} accent={colors.accent} />,
    plumbing: <Pipes base={colors.base} shade={colors.shade} accent={colors.accent} />,
    electrical: <Electrical base={colors.base} shade={colors.shade} accent={colors.accent} />,
    aggregates: <Aggregate base={colors.base} shade={colors.shade} accent={colors.accent} />,
  };
  const transform = scene === "alternate" ? "translate(22 8) scale(.9) rotate(4 260 180)" : scene === "use" ? "translate(-12 14) scale(.84) rotate(-5 260 180)" : scene === "detail" ? "translate(0 -6) scale(1.04)" : undefined;
  return <svg className={`product-artwork artwork-${scene}`} viewBox="0 0 520 360" role="img" aria-label={`Original illustrative ${colors.label} diagram; actual product packaging may differ`}>
    <defs><linearGradient id={`bg-${category}-${scene}`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#f0f2ed"/></linearGradient></defs>
    <rect width="520" height="360" fill={`url(#bg-${category}-${scene})`} />
    <circle cx="430" cy="76" r="110" fill={colors.accent} opacity=".22" />
    <circle cx="72" cy="288" r="96" fill={colors.base} opacity=".08" />
    <g filter="drop-shadow(0 16px 14px #26372d1c)" transform={transform}>{art[category] ?? art.steel}</g>
    <text x="22" y="333" fontFamily="Arial, sans-serif" fontSize="12" letterSpacing="2" fill="#667268">ILLUSTRATIVE PRODUCT PROFILE</text>
  </svg>;
}
