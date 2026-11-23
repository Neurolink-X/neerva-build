import type { Metadata } from "next";
import Link from "next/link";
import { CustomerQuoteInbox } from "@/components/customer-quote-inbox";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = { title: "Your dealer quotations", description: "Review private construction material offers connected with your NEERVA BUILD account.", robots: { index: false, follow: false }, alternates: { canonical: "/account/quotes" } };

export default function CustomerQuotesPage() {
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/account">Account /</Link><span className="eyebrow">CUSTOMER · QUOTE INBOX</span><h1>Compare dealer offers clearly.</h1><p>Review itemized quotes, expiry and complete delivered charges before recording your selection.</p></section><section className="section ops-content"><CustomerQuoteInbox /></section><SiteFooter /></main>;
}
