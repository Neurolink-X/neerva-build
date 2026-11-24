import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {StudioCheckout} from "@/components/studio-checkout";
import "@/app/studio-pricing/pricing.css";
export const metadata:Metadata={
 title:"Home Studio & Colour Studio Pricing — ₹149 One-Time | NEERVA BUILD",
 description:"Compare free room-plan and colour previews with optional ₹149 downloadable studio reports. UPI checkout requires account login and verified bank settlement; no automatic renewals.",
 alternates:{canonical:"/studio-pricing"},
 openGraph:{title:"Free Home Design Samples + ₹149 Studio Reports",description:"Try plot plans and wall colours free, upgrade only for detailed personal reports.",url:"/studio-pricing"}
};
export default function StudioPricingPage(){
 return <main className="catalog-page"><SiteHeader/>
  <section className="studio-pricing-hero"><p className="eyebrow">TRY FREE · UPGRADE WHEN READY</p>
   <h1>Start with a real sample.<br/>Pay only for the extra work you need.</h1>
   <p>NEERVA BUILD keeps basic plot plans, 2D/3D concepts and paint previews available without a charge. Choose an optional one-time report if you want a printable room schedule or your own digital paint palette.</p>
   <div className="studio-pricing-highlights"><span>₹149 per studio, one-time</span><span>Free previews remain free</span><span>No fake countdown</span><span>Bank-confirmed access</span></div>
  </section>
  <section className="studio-compare-grid" aria-label="Free and paid feature comparison">
   <article><span>FREE</span><h2>Explore at no charge</h2><strong>₹0</strong><ul>
    <li>Enter a plot width, depth, road side and floors</li>
    <li>Explore available spatial concepts and matching 2D + 3D previews</li>
    <li>Try house and wall colours on sample scenes or a local photo</li>
    <li>Review approximate plan constraints and unverified quantity ideas</li>
   </ul><Link href="/design-studio">Try your free sample →</Link></article>
   <article><span>ONE-TIME UPGRADE</span><h2>Home Studio Pro</h2><strong>₹149</strong><ul>
    <li>All free Home Studio functionality</li>
    <li>Download a detailed printable room schedule with selected plot geometry</li>
    <li>Room positions, dimensions, floor separation and opening summary</li>
    <li>No professional certification, structural design or municipal approval included</li>
   </ul><Link href="/design-studio/portfolio">Preview the room layouts →</Link></article>
   <article><span>ONE-TIME UPGRADE</span><h2>Colour Studio Pro</h2><strong>₹149</strong><ul>
    <li>All free wall-colour previews on local photos</li>
    <li>Download a personal digital four-colour palette specification</li>
    <li>Main wall, feature wall, supporting shade and light trim</li>
    <li>Screen shades are approximate; branded paint-code accuracy is not guaranteed</li>
   </ul><Link href="/design-studio/visualizer">Try paint for free →</Link></article>
  </section>
  <section className="studio-pricing-pay" aria-label="Verified purchase options">
   <StudioCheckout product="home_studio"/><StudioCheckout product="colour_studio"/>
  </section>
  <section className="studio-pricing-faq"><h2>Payment, security and refunds</h2>
   <details><summary>Will payment unlock my report instantly?</summary><p>No. This UPI receiver is manually reconciled. Submitting a transaction reference is not bank confirmation. Only an administrator who verifies the actual ₹149 credit unlocks access. A payment-gateway integration is required for automatic verified unlocks.</p></details>
   <details><summary>Who receives the ₹149 payment?</summary><p>The UPI payee is displayed clearly before payment as ARJUN CHAURASIYA. Confirm the beneficiary in your banking app. Checkout remains paused until the operator, support and refund process has been verified.</p></details>
   <details><summary>Does the plan qualify as an approved house map?</summary><p>No. These are conceptual geometry and presentation aids. Have a qualified architect and engineer verify setbacks, foundations, stairs, structure and local permits before construction.</p></details>
   <details><summary>How do I request help after a duplicate or mistaken payment?</summary><p>Do not pay again. Preserve the bank UTR, transaction date and order reference. Follow the published <Link href="/returns">payments and refund procedure</Link>; refund decisions require independent credit verification.</p></details>
  </section><SiteFooter/></main>
}
