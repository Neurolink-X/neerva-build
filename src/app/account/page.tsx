import type {Metadata} from "next";
import "./account-hub.css";
import {AccountAccess} from "@/components/account-access";
import {SiteFooter,SiteHeader} from "@/components/site-chrome";

export const metadata:Metadata={
 title:"Secure customer account",
 description:"Sign in or create a NEERVA BUILD account to manage your material enquiries. Dealer and administrator access requires separate approval.",
 robots:{index:false,follow:false},alternates:{canonical:"/account"}
};
export default async function AccountPage({searchParams}:{searchParams:Promise<{next?:string}>}){const q=await searchParams;
 return <main className="catalog-page"><SiteHeader/><section className="page-hero page-hero-compact account-status-page">
 <span className="eyebrow">ACCOUNT ACCESS</span><h1>Your account. Your build.</h1>
 <p>Manage orders, quotations, saved materials and your construction project securely.</p>
 </section><section className="section naccount-page"><AccountAccess next={typeof q.next==="string"?q.next:undefined}/></section><SiteFooter/></main>;
}
