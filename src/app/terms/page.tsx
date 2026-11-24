import type {Metadata} from "next";
import Link from "next/link";
export const metadata:Metadata={title:"Terms and Platform Limitations — NEERVA BUILD",robots:{index:false,follow:false}};
export default function TermsPage(){
 return <main style={{maxWidth:880,margin:"auto",padding:"40px 20px",fontFamily:"system-ui",lineHeight:1.75}}>
 <Link href="/">← NEERVA BUILD</Link><h1>Platform terms and current limitations</h1>
 <p><strong>Pre-launch operational information — final legal terms pending review.</strong> Last reviewed 24 November 2026.</p>
 <h2>Design studio</h2><p>Home concepts, floor plans, 3D massing and wall colours are illustrative planning aids. They are not structural drawings, building approvals, engineering certificates, or exact material estimates. Consult a qualified architect and engineer before construction.</p>
 <h2>Materials and quotations</h2><p>Images can depict categories rather than exact products. No dealer inventory, prices, delivery slots, GST status or other merchant claims are confirmed without independent verification. An enquiry or material list does not reserve goods or create a purchase.</p>
 <h2>Accounts</h2><p>Customer accounts use verified email. Merchant, delivery-partner, finance, support and administrator privileges require explicit approval. Users must not submit other people’s personal or payment information.</p>
 <h2>Digital Studio upgrades (optional)</h2><p>Home Studio Pro and Colour Studio Pro are separate one-time ₹149 digital concept report purchases; free sample previews remain free. A report is not a certified drawing, paint-code match, engineering service or building approval. Checkout is disabled until operator identity, secure payment reconciliation and refund/support disclosures are verified. Manual UPI transfers may be confirmed only after a real bank credit is reconciled by an administrator; the submitted UTR alone is not confirmation. Details: <Link href="/studio-pricing">Studio pricing</Link>.</p>
 <h2>Orders, payments and liabilities</h2><p>Physical material orders, dealer fulfilment and automatic payment capture remain unactivated until the relevant checks pass. Digital Studio access is conditional on successful verified payment and is not a recurring subscription. Before collection, Neerva must show the genuine receiver, exact ₹149 service and cancellation/refund terms. See <Link href="/returns">refunds and disputes</Link> and <Link href="/support">protected support</Link>.</p>
 <h2>Before a commercial launch</h2><p>Operator legal identity, business and grievance contact, jurisdiction, cancellation and refund timings, tax invoices and dealer agreement must be reviewed and published. These draft notes are not final business terms.</p>
 <p><Link href="/privacy">Read privacy information</Link> · <Link href="/returns">Returns and refunds status</Link></p>
 </main>;
}