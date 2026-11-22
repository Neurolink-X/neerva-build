import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

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
      <h1>Sign-in is being prepared.</h1>
      <p>Customer and dealer accounts will be enabled after NEERVA BUILD’s separate authentication and database services are configured. This preview will not ask you to enter credentials or pretend to create an account.</p>
      <div className="detail-actions">
        <Link className="button button-dark" href="/materials">Continue browsing materials →</Link>
        <Link className="button button-outline" href="/design-studio">Explore Home Studio</Link>
      </div>
    </section>
    <SiteFooter />
  </main>;
}
