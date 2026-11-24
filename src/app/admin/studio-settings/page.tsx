import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {StudioAdminSettings} from "@/components/studio-admin-settings";
import "@/app/studio-pricing/pricing.css";
export const metadata:Metadata={title:"Studio Pricing & Access Control | NEERVA BUILD Admin",robots:{index:false,follow:false}};
export default function AdminStudioSettingsPage(){return <main className="catalog-page"><SiteHeader/>
 <section className="page-hero page-hero-compact"><p className="eyebrow">ADMIN · STUDIO CONTROLS</p>
 <h1>Control free access and published prices.</h1>
 <p>Choose per-service pricing, preview limits, checkout permission and publication status. Existing payments and entitlements remain auditable.</p>
 <Link href="/admin/studio-payments">Review bank-confirmed payments →</Link></section>
 <div className="section" style={{maxWidth:1170,margin:"0 auto"}}><StudioAdminSettings/></div><SiteFooter/></main>}
