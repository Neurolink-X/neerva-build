import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {AdminSourcingDesk} from "@/components/admin-sourcing-desk";
export const metadata:Metadata={title:"Admin nationwide sourcing queue",robots:{index:false,follow:false}};
export default function AdminFulfilmentPage(){
 return <main className="catalog-page"><SiteHeader/><section className="page-hero page-hero-compact">
  <Link href="/admin/rfqs" className="breadcrumb-link">Admin RFQs /</Link>
  <span className="eyebrow">PROCUREMENT · PLATFORM ADMIN ONLY</span>
  <h1>Help when no dealer is available.</h1>
  <p>Review genuine customer material requests from any Indian delivery pincode. Source manually only with customer consent and verified supplier details. Do not claim automatic nationwide delivery.</p>
 </section><section className="section" style={{maxWidth:1150,margin:"auto",padding:"24px 16px 64px"}}>
  <AdminSourcingDesk/>
 </section><SiteFooter/></main>;
}
