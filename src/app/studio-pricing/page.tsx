import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {StudioCheckout} from "@/components/studio-checkout";
import {StudioPricingCards} from "@/components/studio-pricing-cards";
import "@/app/studio-pricing/pricing.css";
export const metadata:Metadata={
 title:"Home Studio & Colour Studio Pricing — Admin-Controlled One-Time Pricing | NEERVA BUILD",
 description:"Compare free room-plan and colour previews with optional priced downloadable studio reports. UPI checkout requires account login and verified bank settlement; no automatic renewals.",
 alternates:{canonical:"/studio-pricing"},
 openGraph:{title:"Free Home Design Samples + Admin-Priced Studio Reports",description:"Try plot plans and wall colours free, upgrade only for detailed personal reports.",url:"/studio-pricing"}
};
export default function StudioPricingPage(){
 return <main className="catalog-page"><SiteHeader/>
  <section className="studio-pricing-hero"><p className="eyebrow">TRY FREE · UPGRADE WHEN READY</p>
   <h1>Start with a real sample.<br/>Pay only for the extra work you need.</h1>
   <p>NEERVA BUILD keeps basic plot plans, 2D/3D concepts and paint previews available without a charge. Choose an optional one-time report if you want a printable room schedule or your own digital paint palette.</p>
   <div className="studio-pricing-highlights"><span>Flexible one-time price per Studio</span><span>Free previews remain free</span><span>No fake countdown</span><span>Bank-confirmed access</span></div>
  </section>
  <StudioPricingCards/>
  <section className="studio-pricing-pay" aria-label="Verified purchase options">
   <StudioCheckout product="home_studio"/><StudioCheckout product="colour_studio"/>
  </section>
  <section className="studio-pricing-faq"><h2>Payment, security and refunds</h2>
   <details><summary>Will payment unlock my report instantly?</summary><p>No. This UPI receiver is manually reconciled. Submitting a transaction reference is not bank confirmation. Only an administrator who verifies the actual order-price credit unlocks access. A payment-gateway integration is required for automatic verified unlocks.</p></details>
   <details><summary>Who receives the Studio payment?</summary><p>The UPI payee is displayed clearly before payment as ARJUN CHAURASIYA. Confirm the beneficiary in your banking app. Checkout remains paused until the operator, support and refund process has been verified.</p></details>
   <details><summary>Does the plan qualify as an approved house map?</summary><p>No. These are conceptual geometry and presentation aids. Have a qualified architect and engineer verify setbacks, foundations, stairs, structure and local permits before construction.</p></details>
   <details><summary>How do I request help after a duplicate or mistaken payment?</summary><p>Do not pay again. Preserve the bank UTR, transaction date and order reference. Follow the published <Link href="/returns">payments and refund procedure</Link>; refund decisions require independent credit verification.</p></details>
  </section><SiteFooter/></main>
}
