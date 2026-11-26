import type {Metadata} from "next";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {InspirationStudio} from "@/components/inspiration-studio";
import "./inspiration.css";
import Link from "next/link";
export const metadata:Metadata={title:"Dream Home Inspiration & Mood Boards",description:"Explore home exteriors, interiors, material finishes and colour combinations. Create and share a private inspiration board.",alternates:{canonical:"/inspiration"}};
export default function InspirationPage(){return <main className="catalog-page"><SiteHeader/><InspirationStudio/><section className="section category-guidance"><h2>Practical design knowledge</h2><p>Learn about adaptable layouts, accessible services and durable finishes in the Knowledge Hub.</p><Link href="/learn" prefetch={false}>Explore practical guides →</Link></section><SiteFooter/></main>}
