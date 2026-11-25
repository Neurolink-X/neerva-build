import {DirectOrdersPanel} from "@/components/direct-orders-panel";
import {stockConfirmationEnabled} from "@/modules/orders/stock-confirmation";
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
   <h1>Manage all material orders.</h1>
   <p>Manage direct orders requiring Neerva sourcing and existing dealer orders from one page. Confirm the final delivered amount before preparation.</p>
   <nav className="admin-page-links"><Link href="/admin/fulfilment">Supplier sourcing</Link><Link href="/admin/rfqs">RFQ queue</Link><Link href="/admin/system-health">System health</Link></nav>
  </section>
  <section className="section ops-content"><p><Link href="/admin/dealer-settlements">Dealer commissions & payouts →</Link></p><DirectOrdersPanel role="admin"/><h2>Dealer offer orders</h2><OrderOperationsPanel role="admin" atomicStock={stockConfirmationEnabled(process.env)}/></section>
  <SiteFooter/>
 </main>;
}