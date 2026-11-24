import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import "@/app/studio-pricing/pricing.css";
export const metadata:Metadata={title:"Returns, Refunds & Studio Payment Help — NEERVA BUILD",
 description:"Understand Neerva Build digital Studio purchases, manual UPI verification, duplicate payments, refund requests and the separate material quote process.",
 alternates:{canonical:"/returns"},robots:{index:false,follow:true}};
export default function ReturnsPage(){
 return <main className="catalog-page"><SiteHeader/>
  <section className="page-hero page-hero-compact"><p className="eyebrow">CUSTOMER PROTECTION · PAYMENT TRANSPARENCY</p>
   <h1>Cancellations, returns and refunds.</h1>
   <p>Understand exactly what was purchased, what has been verified and how to request help. A material quotation and a paid digital Studio report are different services.</p>
   <Link className="button button-dark" href="/support">Open a private support request →</Link>
  </section>
  <article className="studio-policy-document">
   <p><strong>Current availability:</strong> The paid ₹149 Studio checkout is not active unless Neerva has explicitly completed its operator, bank and support verification gates. Do not transfer funds merely because you find a payment QR, UPI ID or old screenshot.</p>
   <h2>1. Free Studio previews</h2>
   <p>Free plot-plan ideas, conceptual 2D/3D previews and basic colour samples do not involve a monetary transaction, so there is no purchase to refund.</p>
   <h2>2. Paid digital Studio reports — ₹149 per studio</h2>
   <p>When checkout is activated, each Home Studio Pro or Colour Studio Pro report is a separate one-time digital purchase, not a subscription. The checkout must show the exact amount, UPI receiver name, terms and scope before you pay. A digital concept is not a signed architectural plan or professional service.</p>
   <p>Submitting a UPI transaction reference does not prove payment. After a bank-confirmed matching credit, the account is granted the purchased report entitlement. No automatic paid access is promised for a manually reviewed QR transfer.</p>
   <h2>3. Failed, mistaken or duplicate transfers</h2>
   <p>If your bank debited money but a verified purchase is not shown, please avoid paying again. Open a support ticket with your account, purchase reference, UPI UTR, date and a brief description. Never disclose your UPI PIN, OTP or banking password.</p>
   <p>Neerva must independently reconcile actual bank credits before deciding whether the payment was received, refund is due or access should be granted. Payment mistakes, duplicate bank-confirmed credits, unavailable digital entitlement and applicable consumer-law remedies will be reviewed fairly; a self-reported UTR alone cannot settle the case.</p>
   <h2>4. Refund request and status</h2>
   <ol><li>Sign in and use <Link href="/support">the secure support form</Link> to request cancellation, refund or access help.</li>
    <li>Identify the transaction and explain the reason. Admin reviews the corresponding bank credit and entitlement status.</li>
    <li>The decision and response are recorded against your private support ticket. If money is returned, bank processing time depends on the originating payment network and will be communicated in the case.</li></ol>
   <p>These are pre-launch operational steps rather than a promise of instant refunds or a fixed turnaround. Neerva must publish verified legal operator details, a grievance contact, definite eligibility and settlement timeframes before activating paid checkout.</p>
   <h2>5. Construction materials, dealers and delivery</h2>
   <p>Current material listings, basket drafts and quotation requests are not completed purchases. Dealer inventory, GST, freight, unloading, product warranties, order confirmation, returns and refund policies depend on verified seller terms. No universal material return promise is made before payment and fulfillment are activated.</p>
   <h2>6. If you suspect fraud</h2>
   <p>Only trust payment details shown inside a securely signed-in Neerva checkout. Do not pay off-platform contacts pretending to guarantee instant Home Studio unlocks, material stock or delivery. Report suspicious requests via <Link href="/support">secure customer support</Link> and your UPI/bank provider.</p>
   <p className="studio-policy-footer">Last updated 24 November 2026 · <Link href="/terms">Platform terms</Link> · <Link href="/privacy">Privacy & payment data</Link> · <Link href="/studio-pricing">Compare Studio plans</Link></p>
  </article><SiteFooter/></main>;
}
