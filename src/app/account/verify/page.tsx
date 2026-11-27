import type {Metadata} from "next";
import Link from "next/link";
import {AccountAccess} from "@/components/account-access";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import "../account-hub.css";
export const metadata:Metadata={title:"Secure email verification | Neerva Build",robots:{index:false,follow:false}};
export default async function VerifyPage({searchParams}:{searchParams:Promise<{next?:string}>}){
 const {next}=await searchParams;
 return <main className="catalog-page"><SiteHeader/><section className="page-hero page-hero-compact account-status-page"><span className="eyebrow">NEERVA BUILD · SECURE ACCOUNT</span><h1>Verify your email.</h1><p>Use the latest link sent to your inbox. Your account is verified only when our authentication service accepts the link.</p><Link href="/support">Need help with email delivery?</Link></section><section className="section naccount-page"><AccountAccess next={next}/></section><SiteFooter/></main>;
}
