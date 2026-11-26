import Link from "next/link";
import {DirectOrdersPanel} from "@/components/direct-orders-panel";
import { OrderList } from "@/components/order-list";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
export const metadata = {
  title: "My Orders",
  robots: { index: false, follow: false },
};
export default function Orders() {
  return (
    <main className="catalog-page">
      <SiteHeader />
      <section className="section ops-content">
        <h1>My Orders</h1><nav className="neerva-journey-links" aria-label="Order help and next actions"><Link href="/account/quotes">My quotations →</Link><Link href="/my-project">My construction project →</Link><Link href="/support">Order help →</Link><Link href="/returns">Returns & refunds →</Link></nav>
        <DirectOrdersPanel role="customer"/><h2>Dealer offer orders</h2><OrderList />
      </section>
      <SiteFooter />
    </main>
  );
}
