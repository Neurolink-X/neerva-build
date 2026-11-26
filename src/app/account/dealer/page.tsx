import type {Metadata} from "next";
import {DealerOnboarding} from "@/components/dealer-onboarding";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import "./onboarding.css";
export const metadata:Metadata={title:"Become a Neerva dealer",robots:{index:false,follow:false}};
export default function Page(){return <main className="catalog-page"><SiteHeader/><section className="page-hero account-status-page"><span className="eyebrow">BUSINESS PARTNERS</span><h1>Build your dealer business with Neerva.</h1><p>Apply for verified dealer access, manage materials and respond to real customer requirements after approval.</p></section><section className="section dealer-onboarding-shell"><DealerOnboarding/></section><SiteFooter/></main>}
