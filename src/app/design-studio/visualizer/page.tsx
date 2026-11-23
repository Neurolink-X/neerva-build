import type { Metadata } from "next";
import { ExteriorVisualizer } from "@/components/exterior-visualizer";
import "./color-upgrade.css";

export const metadata: Metadata = { title: "Exterior Paint & Elevation Visualizer", description: "Try wall colours, cladding, window frames, balcony railings, glass tint and gate finishes on an original conceptual facade.", robots: { index: false, follow: false }, alternates: { canonical: "/design-studio/visualizer" } };
export default function ExteriorVisualizerPage() { return <main className="visualizer-page"><ExteriorVisualizer /></main>; }
