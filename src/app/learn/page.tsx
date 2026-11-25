import type {Metadata} from "next";
import Link from "next/link";
import {SiteHeader,SiteFooter} from "@/components/site-chrome";
import "@/app/studio-pricing/pricing.css";
export const metadata:Metadata={title:"House Planning & Material Buying Guides in India",description:"Understand gaj plot sizes, 2D vs 3D home designs, wall paint patterns, road-facing parking and verified construction material quotes.",alternates:{canonical:"/learn"}};
const guides=[
 {title:"Convert gaj to square feet and fit a plot",href:"/learn/plot-size-in-gaj",summary:"120, 130, 140 and 150 gaj examples; why actual frontage and depth matter."},
 {title:"How the same house plan must appear in 2D and 3D",href:"/learn/2d-to-3d-house-layout",summary:"Check exact rooms, stairs, parking, doors and each floor before choosing a design."},
 {title:"Wall-colour and pattern combinations that work",href:"/learn/wall-paint-pattern-ideas",summary:"Learn main/feature walls, lighting, texture, paint tiers and accurate physical sampling."}];
export default function LearningHub(){return <main className="catalog-page"><SiteHeader/>
<section className="page-hero"><p className="eyebrow">NEERVA HOMEOWNER LEARNING HUB</p><h1>Better home decisions start with clear measurements.</h1>
<p>Practical, original guides for Indian plots, room arrangement, paint previews and construction material buying. No unverified prices or construction-approval promises.</p></section>
<section className="section"><Link href="/inspiration" className="button button-dark">Explore and save home inspiration →</Link></section><section className="studio-learning-grid" aria-label="Construction and studio educational resources">
{guides.map(g=><article key={g.href}><h2><Link href={g.href}>{g.title}</Link></h2><p>{g.summary}</p><Link href={g.href}>Read practical guide →</Link></article>)}
</section><section className="studio-policy-document"><h2>Try the tools as you read</h2><p>Compare a custom plot in the <Link href="/design-studio">Home Studio</Link>, test shades in the <Link href="/design-studio/visualizer">Colour Studio</Link>, and compare specifications in <Link href="/materials">the materials catalog</Link>. These are decision aids; an architect/engineer must approve construction details.</p></section><SiteFooter/></main>}