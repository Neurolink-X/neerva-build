import type { Metadata } from "next";
import Link from "next/link";
import { QuickCalculators } from "@/components/quick-calculators";
import "../build-iq/academy.css";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Construction Calculators", description: "Three smart workspaces for plot design, construction quantities and sustainable homes.", alternates: { canonical: "/calculators" } };
export default function CalculatorsPage() { return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><span className="eyebrow">CONSTRUCTION CALCULATORS</span><h1>Plan smarter.<br /><em>Three tools for your home.</em></h1><p>Choose a purpose, enter measured values and get an instant planning estimate.</p></section><section className="section calculator-page-content"><div className="academy"><QuickCalculators /></div><aside className="category-guidance"><h2>About estimates</h2><p>Area conversion is arithmetic, but permissible construction area depends on local setbacks, bylaws and plot conditions. Material estimates are not engineering instructions. Ask a qualified professional to review project-specific quantities.</p><p>Cost scenarios use your own current rates, not price forecasts.</p></aside><Link className="button button-outline" href="/design-studio">Use these dimensions in Home Studio →</Link></section><SiteFooter /></main>; }
