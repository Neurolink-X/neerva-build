import type {Metadata} from "next";
import Image from "next/image";
import {futureArchitecture} from "@/modules/home/future-architecture";
const visualIdeas=futureArchitecture.filter(a=>["mixed-use-building","modern-apartments","climate-smart-apartments"].includes(a.id));
import Link from "@/components/intent-link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import {BuildingPurposeStudio} from "@/components/building-purpose-studio";
import "./buildings.css";
import {buildingPurposes,type BuildingPurpose} from "@/modules/studio/building-purpose";
export const metadata:Metadata={title:"Commercial Building, School & Rental Planning",description:"Compare purpose-specific building zoning concepts for retail, schools, restaurants and rental properties. Professional review required.",alternates:{canonical:"/design-studio/buildings"}};
export const dynamic="force-dynamic";
export default async function BuildingsPage({searchParams}:{searchParams:Promise<{purpose?:string}>}){const p=(await searchParams).purpose;const initialPurpose=buildingPurposes.includes(p as BuildingPurpose)?p as BuildingPurpose:undefined;return <main className="catalog-page"><SiteHeader/><BuildingPurposeStudio initialPurpose={initialPurpose} cloudEnabled={process.env.COMMERCIAL_PROJECT_STORAGE_ENABLED==="true"}/><section id="commercial-visual-ideas" className="section category-guidance"><h2>Visual ideas for commercial and rental buildings</h2><p>Explore existing AI-assisted facade concepts. These are inspiration, not your generated floor plan or approved drawings.</p><div className="commercial-idea-strip" aria-label="Building inspiration">{visualIdeas.map(a=><article key={a.id}><Link href={"/learn/future-homes#"+a.id} prefetch={false}><Image src={a.src} alt={a.alt} width={a.width} height={a.height} unoptimized loading="lazy" decoding="async" fetchPriority="low"/><strong>{a.title}</strong></Link><p>{a.summary}</p></article>)}</div><Link href="/learn/future-homes#modern-apartments" prefetch={false}>See architecture concepts →</Link></section><SiteFooter/></main>}
