import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { AccountAccess } from "@/components/account-access";

export const metadata: Metadata = {
  title: "Account access",
  description: "NEERVA BUILD account access is being prepared while the separate authentication service is configured.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/account" },
};

export default function AccountPage() {
  return <main className="catalog-page">
    <SiteHeader />
    <section className="page-hero account-status-page">
      <span className="eyebrow">ACCOUNT ACCESS</span>
      <h1>Keep your build in view.</h1>
      <p>Sign in to manage saved material requests and construction plans. Dealer and administrator access is granted separately.</p>
      <Link href="/account/orders">My Orders</Link><AccountAccess />
      <div className="detail-actions"><Link className="button button-outline" href="/materials">Continue browsing materials →</Link><Link className="button button-outline" href="/design-studio">Explore Home Studio</Link></div>
    </section>
    <SiteFooter />
  </main>;
}
