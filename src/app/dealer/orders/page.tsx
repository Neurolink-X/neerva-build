import {stockConfirmationEnabled} from "@/modules/orders/stock-confirmation";
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
   <p>Handle only customer-accepted, verified dealer offers. Confirm actual stock, prepare materials and record dispatch. The customer acknowledges receipt from their own account; this screen does not collect payment.</p>
   <nav className="admin-page-links"><Link href="/dealer/quotes">Quotation invitations</Link><Link href="/dealer/inventory">Stock</Link><Link href="/account">Account</Link></nav>
  </section>
  <section className="section ops-content"><OrderOperationsPanel role="dealer" atomicStock={stockConfirmationEnabled(process.env)}/></section>
  <SiteFooter/>
 </main>;
}