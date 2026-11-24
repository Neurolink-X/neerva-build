import type {Metadata} from "next";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {StudioSupportForm} from "@/components/studio-support-form";
import Link from "next/link";
import "@/app/studio-pricing/pricing.css";
export const metadata:Metadata={title:"Customer support & payment help | NEERVA BUILD",
 description:"Get private assistance for a Neerva Build Studio payment, UPI receipt, refund claim or digital-access issue.",
 alternates:{canonical:"/support"},robots:{index:false,follow:true}};
export default function SupportPage(){
 return <main className="catalog-page"><SiteHeader/>
 <section className="page-hero page-hero-compact"><p className="eyebrow">NEERVA BUILD CUSTOMER HELP</p><h1>Help that leaves a clear record.</h1>
 <p>Keep payment and support details within your verified account. We never ask for OTPs, UPI PINs or complete bank passwords.</p>
 <Link href="/returns">View cancellations and refunds →</Link></section>
 <section className="section" style={{maxWidth:860,margin:"0 auto"}}><StudioSupportForm/></section><SiteFooter/></main>;
}
