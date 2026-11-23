import type { Metadata } from "next";
import Link from "next/link";
import { DealerQuoteInbox } from "@/components/dealer-quote-inbox";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Dealer quote requests", description: "Respond to private construction material quote requests invited to your NEERVA BUILD dealer account.", robots: { index: false, follow: false }, alternates: { canonical: "/dealer/quotes" } };

export default function DealerQuotesPage() {
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/account">Account /</Link><span className="eyebrow">DEALER · PRIVATE QUOTATIONS</span><h1>Respond with a complete offer.</h1><p>Review customer requirements, price every line, state the offer expiry and disclose freight, tax and unloading before sending.</p><nav className="admin-page-links"><Link href="/account/orders">Fulfil orders</Link><Link href="/dealer/inventory">Manage inventory</Link><Link href="/business-model">Dealer storefront model</Link></nav></section><section className="section ops-content"><DealerQuoteInbox /></section><SiteFooter /></main>;
}
