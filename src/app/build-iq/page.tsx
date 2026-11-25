import type {Metadata} from "next";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {BuildIQ} from "@/components/build-iq";
import "./build-iq.css";
export const metadata:Metadata={title:"Build IQ — Free construction knowledge quiz",description:"Explore building materials, home planning, colour and smart buying with a free interactive quiz."};
export default function BuildIQPage(){return <main className="catalog-page"><SiteHeader/><section className="page-hero page-hero-compact"><span className="eyebrow">EXPLORE · LEARN · CREATE</span><h1>How much do you know about homes?</h1><p>Discover construction ideas, learn useful facts and explore your creativity. Everyone is welcome, whether or not you are building today.</p></section><BuildIQ/><SiteFooter/></main>}
