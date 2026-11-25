import Link from "next/link";
const guidance={
room:["Adaptable interiors · Japan","Compare compact layouts and movable furniture; keep exit routes clear. Future possibility: interchangeable interior components. Verify actual dimensions and furniture anchorage."],
inspiration:["Industrial precision · China and repairability · Japan","Explore repeatable dimensions, accessible services, shading and replaceable finishes. Future possibility: reusable components with portable material records. Adapt to Indian heat and monsoon."],
calculator:["Measure first · China and Japan","Use modular pitch, measured quantities, rainwater and ventilation geometry before procurement. Future possibility: quantities linked to coordinated digital models. Estimates do not establish structural safety."],
plan:["Coordinated design · China and seismic resilience · Japan","Coordinate architecture, structure and services before construction. Future possibility: interoperable models and digital inspections. Indian seismic design requires qualified professionals."]
} as const;
export function GlobalPractice({section}:{section:keyof typeof guidance}){const [title,body]=guidance[section];return <details style={{marginBlock:"1rem",padding:"1rem",border:"1px solid currentColor",borderRadius:12}}><summary>{title}</summary><p>{body}</p><Link href="/build-iq#global-construction">Learn the technology and its limitations →</Link></details>}
