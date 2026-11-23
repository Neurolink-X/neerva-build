import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
export const metadata:Metadata={title:"Dealer Enterprise Pages",description:"Discover how a branded supplier profile and material enquiry page can work on Neerva Build."};
export default function BusinessModelPage(){return <main className="catalog-page"><SiteHeader/><section className="page-hero">
 <span className="eyebrow">FOR CONSTRUCTION MATERIAL DEALERS</span><h1>Build a stronger digital storefront.</h1>
 <p>Neerva plans individual dealer pages, controlled material listings, local enquiries and transparent itemized quotations. Branded pages are separate from approval to supply or publish prices.</p>
 </section><section className="section" style={{maxWidth:920,margin:"auto"}}><h2>A storefront with your identity.</h2>
 <p>Show your business name, service PIN codes, material categories and verified account status. Customers can prepare an enquiry without seeing speculative stock or prices.</p>
 <h2>Commercial terms</h2><p>Any proposed setup or maintenance fee requires a signed commercial agreement. No subscription, lead priority or selling rate is currently represented as active.</p>
 <p><Link className="button button-dark" href="/account">Check dealer account access →</Link></p>
 <p>Dealer verification, payment integrations and publishing approvals are being completed. Never share GST documents through an unverified form.</p></section><SiteFooter/></main>}
