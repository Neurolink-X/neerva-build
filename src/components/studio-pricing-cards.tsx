"use client";
import Link from "next/link";
import {useStudioSettings} from "@/components/use-studio-settings";
import {studioProducts,type StudioProduct} from "@/modules/studio/paid-products";
const money=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2});
function StudioCard({product}:{product:StudioProduct}){
 const {config,ready}=useStudioSettings(product),name=studioProducts[product].label;
 const route=product==="home_studio"?"/design-studio/portfolio":"/design-studio/visualizer";
 return <article>
  <span>{config.mode==="free"?"FREE ACCESS": "OPTIONAL ONE-TIME UPGRADE"}</span>
  <h2>{name}</h2>
  <strong>{ready&&config.published?(config.mode==="free"?"FREE":money.format(config.pricePaise/100)):"Price not available"}</strong>
  <ul>{product==="home_studio"?<>
   <li>All free plot and 2D/3D concept previews remain accessible</li>
   <li>Download a selected plan room schedule with floor and geometry details</li>
   <li>Room measurements, conceptual openings and access information</li>
   <li>Not an engineer-certified CAD drawing or construction permit</li>
  </>:<>
   <li>All free sample photos and wall colour previews</li>
   <li>Download a personal four-colour design palette</li>
   <li>Main, feature, supporting and trim colour concepts</li>
   <li>Digital shades are approximate; real paint matching needs physical samples</li>
  </>}</ul>
  <p>{ready&&config.published?config.mode==="free"?"Admin has enabled free personal reports. Sign in to use them.":"Published price applies to new orders. Bank-confirmed UPI receipt required for unlock.":"Checkout is unavailable while the published plan cannot be verified."}</p>
  <Link href={route}>Try the sample Studio →</Link>
 </article>;
}
export function StudioPricingCards(){return <section className="studio-compare-grid" aria-label="Free and paid Studio features">
 <article><span>ALWAYS FREE</span><h2>Try basic samples</h2><strong>₹0</strong>
  <ul><li>Enter your plot and compare public example ideas</li>
   <li>Preview selected 2D/3D room arrangements</li>
   <li>Try colours on sample photos or your local wall photograph</li>
   <li>Understand approximate quantities and design limitations</li></ul>
  <Link href="/design-studio">Start with the free sample →</Link></article>
 <StudioCard product="home_studio"/><StudioCard product="colour_studio"/>
 </section>}
