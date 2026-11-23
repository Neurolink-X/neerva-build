import type { Metadata } from "next";
import Link from "next/link";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { catalogCategories } from "@/modules/catalog/catalog";
import {cleanQuotePrefill} from "@/modules/catalog/quote-prefill";

export const metadata: Metadata = { title: "Request a Construction Material Quote", description: "Prepare a private construction material enquiry with quantity, delivery city and pincode. Prepare a material enquiry. Secure submission will open only after verified dealers and support are operational; no live prices or offers are promised.", robots: { index: false, follow: false }, alternates: { canonical: "/quotes" } };
type Props = { searchParams: Promise<{ category?: string; material?: string; city?:string;quantity?:string;pincode?:string }> };

export default async function QuotePage({ searchParams }: Props) {
  const query = await searchParams;
  const draft = cleanQuotePrefill(query);
  const category = catalogCategories.some((item) => item.slug === query.category) ? query.category! : "aggregates";
  return <main className="catalog-page"><SiteHeader /><section className="page-hero page-hero-compact"><Link className="breadcrumb-link" href="/materials">Materials catalog /</Link><span className="eyebrow">BULK & DEALER QUOTES</span><h1>Get the full amount<br /><em>before you accept.</em></h1><p>Share material details, quantity and delivery location. Use the form to prepare a private request. Verified email sign-in and operator activation will be required before submission opens. No price, stock or delivery is guaranteed.</p></section><section className="section quote-page-content"><div className="quote-page-copy"><span className="eyebrow">PRIVATE ENQUIRY</span><h2>One request, clear terms.</h2><p>Request intake is currently paused: there are no approved dealers. Once activated, verified customer requests will be checked, rate-limited and stored privately in the dedicated Neerva database. A prepared form is not a submitted order.</p><ol><li>Specify the exact product or material.</li><li>Include a realistic quantity and delivery pincode.</li><li>Review itemized dealer offers before making a commitment.</li></ol><div className="quote-page-links"><Link href="/materials">Browse material examples →</Link><Link href="/brands">See brand options →</Link></div></div><QuoteRequestForm defaultCity={draft.city} defaultCategory={category} defaultMaterial={draft.material} defaultQuantity={draft.quantity} defaultPincode={draft.pincode} /></section><SiteFooter /></main>;
}
