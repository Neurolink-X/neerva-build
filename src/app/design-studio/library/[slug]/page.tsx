import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {findStudioDesign,studioDesigns} from "@/modules/studio/library";
import {StudioDesignDetail} from "@/components/studio-design-detail";
import "../gallery.css";
export function generateStaticParams(){return studioDesigns.map(d=>({slug:d.slug}))}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const d=findStudioDesign(slug);if(!d)return {title:"Concept unavailable"};return {title:d.title+" — Home Design Studio",description:"Original "+d.bedrooms+" BHK concept for "+d.plot.widthFt+" × "+d.plot.depthFt+" ft plot. View plan and experiment with colours. Architect approval required.",alternates:{canonical:"/design-studio/library/"+d.slug},openGraph:{title:d.title,description:"Original, plan-led Indian home design concept."}}}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const d=findStudioDesign(slug);if(!d)notFound();const schema={"@context":"https://schema.org","@type":"CreativeWork",name:d.title,description:"Original conceptual home layout. Professional review required.",inLanguage:"en-IN",creator:{ "@type":"Organization",name:"NEERVA BUILD"},url:(process.env.NEXT_PUBLIC_SITE_URL??"https://neerva-build.vercel.app")+"/design-studio/library/"+d.slug};return <><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/><StudioDesignDetail design={d}/></>}
