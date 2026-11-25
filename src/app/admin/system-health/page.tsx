import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { MarketplaceReadinessPanel } from "@/components/marketplace-readiness-panel";
import { SystemHealthPanel } from "@/components/system-health-panel";

export const metadata: Metadata = { title: "System health and incidents", description: "Private incident triage for NEERVA BUILD administrators.", robots: { index: false, follow: false }, alternates: { canonical: "/admin/system-health" } };

export default function SystemHealthPage() {
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/account">Account /</Link><span className="eyebrow">ADMIN · OPERATIONS</span><h1>System health &amp; errors.</h1><p>See where an instrumented issue occurred, its safe error code, customer impact and trace reference. Incident data is restricted to platform administrators.</p><nav className="admin-page-links"><Link href="/admin/catalog">Catalog</Link><Link href="/admin/users">User access</Link><Link href="/dealer/inventory">Dealer inventory</Link></nav></section><section className="section ops-content"><MarketplaceReadinessPanel /><SystemHealthPanel /></section><SiteFooter /></main>;
}
