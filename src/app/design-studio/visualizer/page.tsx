import type { Metadata } from "next";
import { ExteriorVisualizer } from "@/components/exterior-visualizer";
import {SiteFooter} from "@/components/site-chrome";
import "./color-upgrade.css";

export const metadata: Metadata = { title: "Wall Colours & Signature Designs | NEERVA BUILD", description: "Preview wall colours, murals, decorative finishes and selected facade surfaces on sample rooms or your private photo.", robots: { index: false, follow: false }, alternates: { canonical: "/design-studio/visualizer" } };
export default function ExteriorVisualizerPage() { return <main className="visualizer-page"><ExteriorVisualizer /><SiteFooter/></main>; }
