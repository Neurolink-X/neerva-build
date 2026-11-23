import type {Metadata} from "next";
import Link from "next/link";
export const metadata:Metadata={title:"Returns and Refunds — NEERVA BUILD",robots:{index:false,follow:false}};
export default function ReturnsPage(){
 return <main style={{maxWidth:880,margin:"auto",padding:"40px 20px",fontFamily:"system-ui",lineHeight:1.75}}>
 <Link href="/">← NEERVA BUILD</Link><h1>Returns, cancellations and refunds</h1>
 <p><strong>Pre-launch information; no purchase or payment is accepted through Neerva’s current digital flow.</strong></p>
 <p>A private quotation request is not a paid order. Since orders and checkout are not activated, no online Neerva transaction can currently qualify for a platform-processed return or refund.</p>
 <p>Before enabling payment or fulfilment, Neerva must publish merchant-specific cancellation rules, return eligibility, refund settlement time limits, defective-product handling, delivery damage reporting, a documented dispute process and a verified grievance contact, reviewed by qualified legal and tax advisers.</p>
 <p>Do not send money to unverified phone numbers or personal payment accounts claiming to be Neerva representatives.</p>
 <Link href="/terms">Platform terms and limitations</Link>
 </main>;
}