import Link from "next/link";
import {CustomerOrdersWorkspace} from "@/components/customer-orders-workspace";
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
        <span className="eyebrow">YOUR ACCOUNT</span><h1>My orders</h1><p>Track material purchases, review final prices and manage deliveries in one place.</p><nav className="neerva-journey-links" aria-label="Order help and next actions"><Link href="/account/quotes">My quotations →</Link><Link href="/my-project">My construction project →</Link><Link href="/support">Order help →</Link><Link href="/returns">Returns & refunds →</Link></nav>
        <CustomerOrdersWorkspace/>
      </section>
      <SiteFooter />
    </main>
  );
}
