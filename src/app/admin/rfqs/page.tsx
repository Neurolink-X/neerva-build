import type { Metadata } from "next";
import Link from "next/link";
import { AdminRfqPanel } from "@/components/admin-rfq-panel";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Admin material requests", description: "Triage open construction material requests and invite eligible dealers.", robots: { index: false, follow: false }, alternates: { canonical: "/admin/rfqs" } };

export default function AdminRfqPage() {
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/account">Account /</Link><span className="eyebrow">ADMIN · MARKETPLACE</span><h1>Route material requests.</h1><p>Review real customer enquiries across India. If no verified dealer can respond, the enquiry enters an admin-sourcing-needed state. A confirmed order requires the separate secure order service.</p><nav className="admin-page-links"><Link href="/admin/catalog">Catalog</Link><Link href="/admin/pricing">Price review</Link><Link href="/admin/system-health">System health</Link></nav></section><section className="section ops-content"><AdminRfqPanel /></section><SiteFooter /></main>;
}
