import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Privacy and quote request data",
  description: "How NEERVA BUILD handles information submitted for a private construction material quotation.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return <main className="catalog-page"><SiteHeader /><section className="page-intro"><span className="eyebrow">PRIVACY Â· QUOTE REQUESTS</span><h1>Your site details have a clear purpose.</h1><p>This page explains the current quote-request data flow. It is an operational summary, not a substitute for a reviewed legal privacy notice.</p></section><section className="policy-content">
    <article><h2>What you submit</h2><p>When you request a material quote, the platform receives the material list, delivery city and pincode, requested date if provided, site address or landmark, your name and mobile number, and basic security and request references.</p></article>
    <article><h2>Who can see it</h2><p>The customer account and authorized NEERVA support or platform administrators can access the request. A dealer sees the site address only after an administrator invites that dealer to quote for your requested service area. Your mobile number remains restricted to you and authorized support/admin; an authorized member of the selected dealer can access it after you accept that dealerâ€™s offer.</p></article>
 ¶»§q«^