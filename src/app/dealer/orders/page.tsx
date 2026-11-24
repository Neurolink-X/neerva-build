import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {OrderOperationsPanel} from "@/components/order-operations-panel";
export const metadata:Metadata={title:"Dealer order fulfillment",description:"Private, approved-dealer order status and delivery confirmation workflow.",robots:{index:false,follow:false}};
export default function DealerOrdersPage(){
 return <main className="catalog-page">
  <SiteHeader/>
  <section className="page-hero page-hero-compact">
   <Link className="breadcrumb-link" href="/account">Account /</Link>
   <span className="eyebrow">DEALER · VERIFIED ORDERS</span>
   <h1>Prepare actual customer orders.</h1>
   <p>Accept a customer's paid-or-unpaid status only from verified records. Confirm stock, prepare materials and record actual dispatch. Customers acknowledge receipt on their own accounts.</p>
   <nav className="admin-page-links"><Link href="/dealer/quotes">Quotation invitations</Link><Link href="/dealer/inventory">Stock</Link><Link href="/account">Account</Link></nav>
  </section>
  <section className="section ops-content"><OrderOperationsPanel role="dealer"/></section>
  <SiteFooter/>
 </main>;
}