import type {Metadata} from "next";
import Link from "@/components/intent-link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {BuildingPurposeStudio} from "@/components/building-purpose-studio";
import "./buildings.css";
export const metadata:Metadata={title:"Building Studio | Commercial, School & Rental Planning | Neerva Build",description:"Compare purpose-specific building zoning concepts for retail, schools, restaurants and rental properties. Professional review required."};
export const dynamic="force-dynamic";
export default function BuildingsPage(){return <main className="catalog-page"><SiteHeader/><BuildingPurposeStudio cloudEnabled={process.env.COMMERCIAL_PROJECT_STORAGE_ENABLED==="true"}/><section className="section category-guidance"><h2>Ideas for flats and mixed-use buildings</h2><p>Explore visual inspiration separately from your generated plan.</p><Link href="/learn/future-homes#modern-apartments" prefetch={false}>See architecture concepts →</Link></section><SiteFooter/></main>}
