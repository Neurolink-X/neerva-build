import type { Metadata } from "next";
import { ExteriorVisualizer } from "@/components/exterior-visualizer";
import {SiteFooter} from "@/components/site-chrome";
import "./color-upgrade.css";

export const metadata: Metadata = { title: "Wall Paint Visualizer & Signature Wall Designs", description: "Explore premium wall murals, geometric artwork and exterior paint colours. Preview designs on sample rooms or a private photo.", alternates: { canonical: "/design-studio/visualizer" }, openGraph:{title:"Wall Paint Visualizer & Signature Wall Designs",description:"Discover complete wall artwork and preview interior and exterior paint concepts.",url:"/design-studio/visualizer",images:[{url:"/opengraph-image",width:1200,height:630,alt:"NEERVA BUILD wall design and home planning"}]} };
export default function ExteriorVisualizerPage() { return <main className="visualizer-page"><ExteriorVisualizer /><SiteFooter/></main>; }
