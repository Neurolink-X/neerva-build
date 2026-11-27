import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
export const metadata:Metadata={title:"Contractor workspace | Neerva Build",description:"Plan materials, compare quotations and manage construction jobs with Neerva."};
const actions=[
 ["Material sourcing","Browse grades, sizes and brands before preparing a bulk order.","/materials","Browse materials"],
 ["Project planning","Organise construction stages, budget and material requirements.","/my-project","Open project planner"],
 ["Bulk quotation","Prepare an itemised request for supplier pricing and delivery.","/quotes","Prepare a request"],
 ["Order tracking","Review direct and dealer orders in your private account.","/account/orders","View orders"],
 ["Construction knowledge","Explore site practice, material calculations and workmanship.","/build-iq","Open Neerva Academy"],
 ["Supplier access","Apply for a separate verified dealer role if you also supply materials.","/account/dealer","Dealer application"]
] as const;
export default function Contractors(){return <main className="catalog-page"><SiteHeader/><section className="page-hero page-hero-compact"><span className="eyebrow">NEERVA BUILD · PROFESSIONALS</span><h1>Build your next project.</h1><p>One workspace to plan construction, source materials and review delivery costs. Existing project and account tools keep your work together.</p><Link className="button button-dark" href="/account">Sign in to your account</Link></section><section className="section" aria-label="Contractor tools"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,250px),1fr))",gap:16}}>{actions.map(([title,description,href,label])=><article key={href} style={{border:"1px solid #d5e0d4",borderRadius:14,padding:18,minWidth:0,display:"grid",gap:10,alignContent:"start"}}><h2 style={{fontSize:"1.35rem",margin:0}}>{title}</h2><p style={{margin:0}}>{description}</p><Link className="button button-outline" href={href}>{label} →</Link></article>)}</div><p>Online quotations and dealer offers depend on verified account access and service availability. No order or supplier commitment is created by opening this workspace.</p></section><SiteFooter/></main>}
