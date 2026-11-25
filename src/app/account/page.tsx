import type {Metadata} from "next";
import {AccountAccess} from "@/components/account-access";
import {SiteFooter,SiteHeader} from "@/components/site-chrome";

export const metadata:Metadata={
 title:"Secure customer account",
 description:"Sign in or create a NEERVA BUILD account to manage your material enquiries. Dealer and administrator access requires separate approval.",
 robots:{index:false,follow:false},alternates:{canonical:"/account"}
};
export default async function AccountPage({searchParams}:{searchParams:Promise<{next?:string}>}){const q=await searchParams;
 return <main className="catalog-page"><SiteHeader/><section className="page-hero account-status-page">
 <span className="eyebrow">ACCOUNT ACCESS</span><h1>Access your projects and requests.</h1>
 <p>Use a verified email to sign in or create a customer account. Dealer and administrator privileges are granted only after a separate review.</p>
 </section><section className="section" style={{maxWidth:750,margin:"0 auto",padding:"24px 16px 72px"}}><AccountAccess next={typeof q.next==="string"?q.next:undefined}/></section><SiteFooter/></main>;
}
