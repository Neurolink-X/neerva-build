import {DeliveryPolicyPanel} from "@/components/delivery-policy-panel";
import {MarketplaceFeePanel} from "@/components/marketplace-fee-panel";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { PricingReviewPanel } from "@/components/pricing-review-panel";

export const metadata: Metadata = { title: "Dealer pricing review", description: "Review and publish dealer price submissions for NEERVA BUILD.", robots: { index: false, follow: false }, alternates: { canonical: "/admin/pricing" } };

export default function AdminPricingPage() {
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/account">Account /</Link><span className="eyebrow">ADMIN · PRICING</span><h1>Review dealer submitted rates.</h1><p>Published public prices are fetched from valid dealer records. Quote-only categories remain private; accepted orders and quotes keep their agreed snapshots.</p><nav className="admin-page-links"><Link href="/admin/catalog">Catalog</Link><Link href="/admin/studio-payments">Studio payments</Link><Link href="/admin/studio-settings">Studio pricing & access</Link><Link href="/admin/system-health">System health</Link><Link href="/admin/users">User access</Link></nav></section><section className="section catalog-admin-content"><MarketplaceFeePanel/><DeliveryPolicyPanel role="admin"/><PricingReviewPanel /></section><SiteFooter /></main>;
}
