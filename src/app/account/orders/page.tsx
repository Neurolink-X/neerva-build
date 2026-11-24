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
        <h1>My Orders</h1>
        <DirectOrdersPanel role="customer"/><h2>Dealer offer orders</h2><OrderList />
      </section>
      <SiteFooter />
    </main>
  );
}
