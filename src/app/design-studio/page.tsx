import type {Metadata} from "next";
import Image from "next/image";
import Link from "@/components/intent-link";
import {StudioStartForm} from "@/components/studio-start-form";
import {SiteFooter,SiteHeader} from "@/components/site-chrome";
import {futureArchitecture} from "@/modules/home/future-architecture";
import {colourFamilies} from "@/modules/studio/colour-families";
import "./studio-landing.css";
export const metadata:Metadata={
 title:"Home, Building & Colour Design Studio | NEERVA BUILD",
 description:"Plan a home or commercial building for your measured plot, compare matching 2D and 3D concepts, explore paint colours and prepare for construction in India.",
 alternates:{canonical:"/design-studio"}
};
const commercial=futureArchitecture.find(a=>a.id==="mixed-use-building")!;
const categories=[["shops","Shops"],["mall","Shopping mall"],["restaurant","Restaurant"],["school","School"],["rental","Rental property"]] as const;
const tools=[
 {title:"Design ideas",description:"Explore architectural styles and plot-specific room arrangements before making a shortlist.",href:"/design-studio/library",action:"Browse design ideas",kind:"plan"},
 {title:"Room layout",description:"Explore room arrangement and furniture placement separately from the building plan.",href:"/room-lab",action:"Open Room Lab",kind:"room"},
 {title:"Plot fit check",description:"Compare older inspiration designs with your measured plot, without treating them as approved plans.",href:"/design-studio/fit",action:"Check inspiration fit",kind:"fit"},
 {title:"Materials & finishes",description:"Browse materials and request dealer-confirmed pricing, availability and specifications.",href:"/materials",action:"Explore materials",kind:"material"}
] as const;
export default function DesignStudioPage(){
 const shadeCount=Object.values(colourFamilies).reduce((n,s)=>n+s.length,0);
 return <main className="nstudio-landing"><SiteHeader/>
  <section className="nstudio-hero" aria-labelledby="studio-heading">
   <div className="nstudio-intro"><p className="eyebrow">NEERVA DESIGN STUDIO · PLAN FOR REAL LIFE</p><h1 id="studio-heading">Design for your space.<br/><em>Build with clarity.</em></h1>
    <p>Start with your real plot, not a random floor plan. Explore homes, commercial buildings and colours in one place, with matching concept drawings and 3D views.</p>
    <div className="nstudio-primary-actions"><a className="nstudio-primary" href="#start">Plan my home</a><Link className="nstudio-secondary" href="/design-studio/buildings" prefetch={false}>Plan a commercial building</Link></div>
    <div className="nstudio-hero-features"><span>Measured plot inputs</span><span>Matching 2D & 3D</span><span>Concepts before construction</span></div>
   </div>
   <figure className="nstudio-photo"><Image src="/images/studio/family/neerva-100gaj-photorealistic.webp" fill priority sizes="(max-width:920px) 100vw, 45vw" alt="AI-assisted Indian family home concept with two levels and a street-facing entrance"/><figcaption>100 gaj family-home inspiration · illustrative, not your generated plan</figcaption></figure>
  </section>
  <nav className="nstudio-section-nav" aria-label="Studio sections"><a href="#start">Residential</a><a href="#commercial">Commercial</a><a href="#colour">Colour Studio</a><a href="#tools">More tools</a><a href="#before-build">Before building</a></nav>
  <section className="nstudio-start" id="start" aria-labelledby="home-planning-heading"><div><p className="eyebrow">01 · RESIDENTIAL STUDIO</p><h2 id="home-planning-heading">Tell us your plot size.</h2><p>Set your real frontage, depth, road direction, bedrooms and floors. Explore up to 24 validated alternatives where feasible. Compact plots may support fewer.</p>
   <div className="nstudio-example-list"><h3>Popular starting points</h3><Link href="/design-studio/portfolio?width=15&depth=30&road=N&floors=1&bedrooms=1&parking=false" prefetch={false}><strong>15 × 30 ft</strong><span>1 BHK · 50 gaj</span></Link><Link href="/design-studio/portfolio?width=18&depth=50&road=N&floors=2&bedrooms=3&parking=true" prefetch={false}><strong>18 × 50 ft</strong><span>3 BHK · 100 gaj</span></Link><Link href="/design-studio/portfolio?width=20&depth=40&road=N&floors=1&bedrooms=2&parking=true" prefetch={false}><strong>20 × 40 ft</strong><span>2 BHK · approx. 89 gaj</span></Link></div>
   <p className="nstudio-note">Examples have preset road and parking choices. Adjust them to match your actual site.</p></div><StudioStartForm/></section>
  <section className="nstudio-feature-section" id="commercial" aria-labelledby="commercial-heading">
   <figure className="nstudio-feature-photo"><Image src={commercial.src} alt={commercial.alt} width={commercial.width} height={commercial.height} unoptimized loading="lazy" decoding="async"/><figcaption>Mixed-use building · visual inspiration only</figcaption></figure>
   <div className="nstudio-feature-copy"><p className="eyebrow">02 · COMMERCIAL & RENTAL STUDIO</p><h2 id="commercial-heading">Plan around the purpose.</h2><p>Choose the building use, floor count, shared facilities, access and parking. Compare purpose-specific plans, elevations and 3D concepts.</p><div className="nstudio-purpose-links">{categories.map(([id,label])=><Link key={id} href={"/design-studio/buildings?purpose="+id} prefetch={false}>{label}</Link>)}</div><Link className="nstudio-primary" href="/design-studio/buildings" prefetch={false}>Open Building Studio</Link></div>
  </section>
  <section className="nstudio-feature-section nstudio-feature-reverse" id="colour" aria-labelledby="colour-heading">
   <figure className="nstudio-feature-photo nstudio-paint-photo"><Image src="/images/studio/paint-room.webp" alt="Sample living room used for the photo-based wall colour preview" width={420} height={280} unoptimized loading="lazy" decoding="async"/><figcaption>Sample room · choose your own shade in Colour Studio</figcaption></figure>
   <div className="nstudio-feature-copy"><p className="eyebrow">03 · COLOUR & FINISHES</p><h2 id="colour-heading">See a new colour before buying paint.</h2><p>Choose a sample room or facade, or mark a wall in your own photo. Try paint, decorative patterns and curated colour combinations. Personal photos stay on your device.</p><div className="nstudio-palette" aria-label="Examples from the digital palette">{["#f0e8d8","#928376","#b6c7a3","#285b65","#ad694f","#604c73","#333b43"].map(shade=><span key={shade} style={{backgroundColor:shade}}/>)}</div><p className="nstudio-note">{shadeCount} digital shades · {Object.keys(colourFamilies).length} colour families. Verify physical shade cards before purchasing.</p><Link className="nstudio-primary" href="/design-studio/visualizer" prefetch={false}>Open Colour Studio</Link></div>
  </section>
  <section className="nstudio-choices" id="tools" aria-labelledby="nstudio-next"><p className="eyebrow">04 · CONTINUE YOUR DESIGN</p><h2 id="nstudio-next">Useful tools, one clear journey.</h2><p>Find inspiration, check dimensions and choose finishes before requesting a material quote.</p><div className="nstudio-choice-grid">{tools.map((tool,i)=><article key={tool.kind}><span>0{i+1}</span><h3>{tool.title}</h3><p>{tool.description}</p><Link href={tool.href} prefetch={false}>{tool.action} →</Link></article>)}</div></section>
  <section className="nstudio-reality" id="before-build" aria-labelledby="before-building-heading"><div><p className="eyebrow">DESIGN WITH CONFIDENCE</p><h2 id="before-building-heading">Before you build</h2><p>A concept is a starting point, not a sanctioned drawing. Ask a licensed architect or engineer to review your actual site, circulation, structural safety, ventilation, setbacks and local approvals. Confirm prices and stock separately.</p></div><div className="nstudio-checks"><span>Measure the site boundary and road edge.</span><span>Review room access, light and ventilation.</span><span>Check stairs, services and structural requirements.</span><span>Approve drawings and quantities before ordering.</span></div><div className="nstudio-reality-links"><Link href="/build-iq" prefetch={false}>Explore practical building knowledge →</Link><Link href="/studio-pricing" prefetch={false}>Compare optional Studio plans →</Link></div></section>
  <SiteFooter/></main>;
}
