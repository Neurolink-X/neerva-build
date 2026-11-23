import type {Metadata} from "next";
import Image from "next/image";
import Link from "next/link";
import {StudioStartForm} from "@/components/studio-start-form";
import {SiteFooter,SiteHeader} from "@/components/site-chrome";
import {homeReferencePhotos} from "@/modules/home/assets";
import "./studio-landing.css";
export const metadata:Metadata={
 title:"Plan Your Dream Home in India | NEERVA BUILD",
 description:"Enter your plot and road side, explore genuinely different room layouts, check matching 2D/3D concepts, then plan materials. Professional review required.",
 alternates:{canonical:"/design-studio"}
};
export default function DesignStudioPage(){
 return <main className="nstudio-landing"><SiteHeader/>
  <section className="nstudio-hero">
   <div className="nstudio-intro"><p className="eyebrow">NEERVA HOME STUDIO · PLAN FOR REAL LIFE</p><h1>Your plot. Your family.<br/><em>A home that fits.</em></h1>
    <p>Don&apos;t start with a random house photo. Enter your plot and where the road is. Compare room arrangements with parking, kitchen, stairs, hall and outdoor space shown in the actual floor plan.</p>
    <div className="nstudio-hero-features"><span>One plot, different layouts</span><span>Road-facing parking</span><span>2D + matched 3D</span></div>
   </div>
   <div className="nstudio-photo"><Image src={homeReferencePhotos[1].src} fill priority sizes="(max-width:820px) 100vw, 45vw" alt="Real photograph of a premium house, shown as visual inspiration rather than a generated design"/><span>Real residential photography · style inspiration only</span></div>
  </section>
  <section className="nstudio-start" id="start"><div><p className="eyebrow">START HERE · ABOUT ONE MINUTE</p><h2>Tell us your plot size.</h2><p>We&apos;ll use the same dimensions when drawing room layouts and viewing the matching 3D building. Your road and car gate should face the same side.</p></div><StudioStartForm/></section>
  <section className="nstudio-choices" aria-labelledby="nstudio-next"><p className="eyebrow">EXPLORE WITH CONFIDENCE</p><h2 id="nstudio-next">Choose what you want to do.</h2>
   <div className="nstudio-choice-grid">
    <article><span>01</span><h3>Find a plan for your plot</h3><p>See what may fit before selecting rooms. Get straight to the generator for validated drafts.</p><Link href="#start">Enter plot dimensions →</Link></article>
    <article><span>02</span><h3>Browse architectural inspiration</h3><p>Explore existing ideas and identify styles you like. Inspiration images are not exact approved plans.</p><Link href="/design-studio/library">View design ideas →</Link></article>
    <article><span>03</span><h3>Try paint on your own photo</h3><p>Upload a private wall photo, mark the wall and compare shades without uploading the image.</p><Link href="/design-studio/visualizer">Open colour studio →</Link></article>
   </div>
  </section>
  <section className="nstudio-reality"><strong>Before you build</strong><p>These tools help you decide the room arrangement and style. Construction drawings, structural safety, ventilation, setbacks and local approvals need a licensed architect or engineer. Pricing and dealer stock require separate verification.</p><Link href="/design-studio/fit">Want to compare older design ideas to your plot? Check the inspiration fit →</Link></section>
  <SiteFooter/></main>;
}
