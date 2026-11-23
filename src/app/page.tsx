import type {Metadata} from "next";
import {PremiumHome} from "@/components/premium-home";
import "./premium-home.css";

export const metadata:Metadata={
 title:"Construction Materials, Brands & Quotes in Kanpur | NEERVA BUILD",
 description:"Explore cement, TMT steel, bricks, tiles, paint, pipes and construction materials by brand, grade and size. Prepare a request, subject to dealer verification. Kanpur first; design studio available.",
 alternates:{canonical:"/"},
 openGraph:{title:"NEERVA BUILD — Materials first. Plan smarter.",description:"Construction materials, manufacturer-reference specifications and itemised quotation planning. Kanpur first. Verified dealer coverage pending.",type:"website",images:[{url:"/opengraph-image",width:1200,height:630,alt:"NEERVA BUILD brand illustration — home planning and construction materials"}]},
};
export default function HomePage(){
 const url=process.env.NEXT_PUBLIC_SITE_URL??"https://neerva-build.vercel.app";
 const data=[
  {"@context":"https://schema.org","@type":"Organization",name:"NEERVA BUILD",url,areaServed:{"@type":"Place",name:"Kanpur, Uttar Pradesh, India"},description:"Construction material product discovery and quotation preparation; home-planning concepts secondary."},
  {"@context":"https://schema.org","@type":"WebSite",name:"NEERVA BUILD",url,potentialAction:{"@type":"SearchAction",target:{"@type":"EntryPoint",urlTemplate:url+"/materials?search={search_term_string}"},"query-input":"required name=search_term_string"}},
 ];
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,"\\u003c")}}/><PremiumHome/></>;
}
