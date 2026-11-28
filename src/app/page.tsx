import {canonicalPublicOrigin} from "@/modules/seo/site-origin";
import type {Metadata} from "next";
import {PremiumHome} from "@/components/premium-home";
import {homeCategoryCartActions} from "@/components/home-featured-materials";
import "./premium-home.css";

export const metadata:Metadata={
 title:"Construction Materials & Home Planning in Kanpur",
 description:"Compare cement, steel, bricks, tiles, paints and pipes in Kanpur. Explore house plans and request dealer-confirmed construction material quotations.",
 alternates:{canonical:"/"},
 openGraph:{title:"NEERVA BUILD — Materials first. Plan smarter.",description:"Construction materials, manufacturer-reference specifications and itemised quotation planning. Kanpur first. Verified dealer coverage pending.",type:"website",url:"/",images:[{url:"/opengraph-image",width:1200,height:630,alt:"NEERVA BUILD brand illustration — home planning and construction materials"}]},
};
export default function HomePage(){
 const url=canonicalPublicOrigin(process.env);
 const data=[
  {"@context":"https://schema.org","@type":"Organization",name:"NEERVA BUILD","@id":url+"/#organization",url,areaServed:{"@type":"Place",name:"Kanpur, Uttar Pradesh, India"},description:"Construction material product discovery and quotation preparation; home-planning concepts secondary."},
  {"@context":"https://schema.org","@type":"WebSite","@id":url+"/#website",name:"NEERVA BUILD",alternateName:"Neerva",url,inLanguage:"en-IN",publisher:{"@id":url+"/#organization"}},
 ];
 return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,"\\u003c")}}/><PremiumHome categoryCartActions={homeCategoryCartActions()}/></>;
}
