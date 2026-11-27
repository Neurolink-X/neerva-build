import "./quote-responsive.css";
import type { Metadata } from "next";
import Link from "next/link";
import { QuoteRequestForm } from "@/components/quote-request-form";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { catalogCategories } from "@/modules/catalog/catalog";
import {rfqIntakeEnabled} from "@/modules/rfq/intake-status";
import {cleanQuotePrefill} from "@/modules/catalog/quote-prefill";

export const metadata: Metadata = { title: "Request a Construction Material Quote", description: "Request construction materials with quantity and delivery location. Review total charges before accepting a quotation.", robots: { index: false, follow: false }, alternates: { canonical: "/quotes" } };
type Props = { searchParams: Promise<{ category?: string; material?: string; city?:string;quantity?:string;unit?:string;pincode?:string }> };

export default async function QuotePage({ searchParams }: Props) {
  const query = await searchParams;
  const draft = cleanQuotePrefill(query);
  const category = catalogCategories.some((item) => item.slug === query.category) ? query.category! : "aggregates";
  return <main className="catalog-page neerva-quote-page"><SiteHeader/>
   <section className="page-hero page-hero-compact quote-hero"><div className="quote-hero-inner"><Link className="breadcrumb-link" href="/materials">← Browse materials</Link><span className="eyebrow">NEERVA BUILD · BETTER BUYING</span><h1>Know the full cost.<br/><em>Then decide.</em></h1><p>Prepare a clear material request with exact quantity and delivery location. Review the itemized dealer terms before accepting an offer.</p><div className="quote-trust"><span>Material & grade</span><span>GST & freight</span><span>Delivery & unloading</span></div></div></section>
   <section className="section quote-page-content"><div className="quote-page-copy"><span className="eyebrow">HOW IT WORKS</span><h2>Less guesswork. More control.</h2><div className="quote-steps"><p><strong>01 · Describe your materials</strong><span>Tell us the type, size, quantity and where you need delivery.</span></p><p><strong>02 · Send your request</strong><span>Sign in and send your request when available. You can also save a copy.</span></p><p><strong>03 · Compare offers when available</strong><span>A verified dealer must confirm GST, freight, unloading, stock and validity before any purchase.</span></p></div><div className="quote-page-links"><Link href="/materials">Browse material categories →</Link><Link href="/brands">Compare manufacturer references →</Link></div></div><QuoteRequestForm intakeEnabled={rfqIntakeEnabled(process.env)} defaultUnit={typeof query.unit==="string"?query.unit:""} defaultCity={draft.city} defaultCategory={category} defaultMaterial={draft.material} defaultQuantity={draft.quantity} defaultPincode={draft.pincode} /></section>
   <SiteFooter/></main>;
}
