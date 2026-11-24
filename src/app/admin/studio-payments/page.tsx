import type {Metadata} from "next";
import Link from "next/link";
import {SiteFooter,SiteHeader} from "@/components/site-chrome";
import {StudioPaymentReview} from "@/components/studio-payment-review";
export const metadata:Metadata={title:"Studio payment reconciliation | NEERVA BUILD",robots:{index:false,follow:false},alternates:{canonical:"/admin/studio-payments"}};
export default function StudioPaymentReviewPage(){
 return <main className="catalog-page"><SiteHeader/>
  <section className="page-hero page-hero-compact"><p className="eyebrow">ADMIN · PAYMENT RECONCILIATION</p>
   <h1>Protect every digital purchase.</h1><p>Release access only after independently matching the bank credit. Self-submitted UTR never unlocks features.</p>
   <Link href="/admin/pricing">← Back to pricing</Link></section>
  <section className="section" style={{maxWidth:1050,margin:"0 auto"}}><StudioPaymentReview/></section><SiteFooter/></main>
}
