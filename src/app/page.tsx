import type {Metadata} from "next";
import {PremiumHome} from "@/components/premium-home";
import "./premium-home.css";

export const metadata:Metadata={
 title:"Plan Your Home, See Colours & Explore Material Quotes | NEERVA BUILD",
 description:"Explore home plans for Indian plots, preview exterior colours and prepare transparent material quote requests. NEERVA BUILD starts in Kanpur.",
 alternates:{canonical:"/"},
 openGraph:{title:"NEERVA BUILD — Plan your home. See it your way.",description:"Plan your home, explore colours and prepare itemised construction material quotes. Starting in Kanpur.",type:"website",images:[{url:"/opengraph-image",width:1200,height:630,alt:"NEERVA BUILD brand illustration — home planning and construction materials"}]},
};
export default function HomePage(){
 const url=process.env.NEXT_PUBLIC_SITE_URL??"https://neerva-build.vercel.app";
 const data=[
  {"@context":"https://schema.org","@type":"Organization",name:"NEERVA BUILD",url,areaServed:{"@type":"Place",name:"Kanpur, Uttar Pradesh, India"},description:"Home planning concepts and material quotation preparation."},
  {"@context":"https://schema.org","@type":"WebSite",name:"NEERVA BUILD",url,potentialAction:{"@type":"SearchAction",target:{"@type":"EntryPoint",urlTemplate:url+"/materials?search={search_term_string}"},"query-input":"required name=search_term_string"}},
 ];
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,"\\u003c")}}/><PremiumHome/></>;
}
