import type { Metadata } from "next";
import Link from "next/link";
import { DealerInventoryPanel } from "@/components/dealer-inventory-panel";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Dealer inventory management", description: "Tenant-scoped inventory and price approval for NEERVA BUILD dealers.", robots: { index: false, follow: false }, alternates: { canonical: "/dealer/inventory" } };

export default function DealerInventoryPage() {
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/account">Account /</Link><span className="eyebrow">DEALER · INVENTORY</span><h1>Keep stock and offers accurate.</h1><p>Update your approved branch inventory. Submitted prices stay private while they are reviewed; customers see only valid approved prices or request a quote.</p><nav className="admin-page-links"><Link href="/dealer/quotes">Customer RFQ invitations</Link><Link href="/dealer/orders">Accepted orders</Link></nav></section><section className="section catalog-admin-content"><DealerInventoryPanel /></section><SiteFooter /></main>;
}
