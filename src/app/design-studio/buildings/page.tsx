import type {Metadata} from "next";
import Link from "@/components/intent-link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {BuildingPurposeStudio} from "@/components/building-purpose-studio";
import "./buildings.css";
import {buildingPurposes,type BuildingPurpose} from "@/modules/studio/building-purpose";
export const metadata:Metadata={title:"Building Studio | Commercial, School & Rental Planning | Neerva Build",description:"Compare purpose-specific building zoning concepts for retail, schools, restaurants and rental properties. Professional review required."};
export const dynamic="force-dynamic";
export default async function BuildingsPage({searchParams}:{searchParams:Promise<{purpose?:string}>}){const p=(await searchParams).purpose;const initialPurpose=buildingPurposes.includes(p as BuildingPurpose)?p as BuildingPurpose:undefined;return <main className="catalog-page"><SiteHeader/><BuildingPurposeStudio initialPurpose={initialPurpose} cloudEnabled={process.env.COMMERCIAL_PROJECT_STORAGE_ENABLED==="true"}/><section className="section category-guidance"><h2>Ideas for flats and mixed-use buildings</h2><p>Explore visual inspiration separately from your generated plan.</p><Link href="/learn/future-homes#modern-apartments" prefetch={false}>See architecture concepts →</Link></section><SiteFooter/></main>}
