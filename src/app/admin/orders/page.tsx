import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {OrderOperationsPanel} from "@/components/order-operations-panel";
export const metadata:Metadata={title:"Admin accepted orders",description:"Verified order transaction and supplier fulfillment administration.",robots:{index:false,follow:false}};
export default function AdminOrdersPage(){
 return <main className="catalog-page">
  <SiteHeader/>
  <section className="page-hero page-hero-compact">
   <Link className="breadcrumb-link" href="/account">Account /</Link>
   <span className="eyebrow">ADMIN · ORDER OPERATIONS</span>
   <h1>Manage accepted supplier orders.</h1>
   <p>Only real customer-accepted offers appear. Confirm supplier availability, manage fulfillment exceptions and keep an audited record. A quotation alone is not an order.</p>
   <nav className="admin-page-links"><Link href="/admin/fulfilment">Supplier sourcing</Link><Link href="/admin/rfqs">RFQ queue</Link><Link href="/admin/system-health">System health</Link></nav>
  </section>
  <section className="section ops-content"><OrderOperationsPanel role="admin"/></section>
  <SiteFooter/>
 </main>;
}