"use client";
import {useState} from "react";
import Image from "next/image";
import {brandMediaFor} from "@/modules/catalog/brand-media";
import {sourcedProducts} from "@/modules/catalog/sourced-products";
import {isLocalCatalogMedia} from "@/modules/catalog/local-media-policy";
import {usableMediaSource} from "@/modules/catalog/failed-media-sources";

/** Only reviewed public reference marks. A broken/blocked CDN URL falls back to
 * the actual brand name instead of a blank logo or a fabricated vector mark. */
export function BrandMark({name,small=false}:{name:string;small?:boolean}){
 const [failed,setFailed]=useState<string[]>([]);
 const media=brandMediaFor(name==="JSW"?"JSW Neosteel":name);
 const pack=sourcedProducts.find(p=>p.brand.toLowerCase()===name.toLowerCase()&&isLocalCatalogMedia(p.referenceImage)&&usableMediaSource(p.referenceImage)&&!failed.includes(p.referenceImage));
 if(!media||!isLocalCatalogMedia(media.logo)||!usableMediaSource(media.logo)||failed.includes(media.logo)){
  if(pack?.referenceImage){const src=pack.referenceImage;return <span className={small?"nb-brand-name nb-brand-name-small":"nb-brand-name"} title="Product reference photo, not the company logo" style={{display:"inline-flex",alignItems:"center",gap:8,maxWidth:"100%"}}><Image src={src} alt={name+" product reference photo"} width={small?36:48} height={small?36:48} unoptimized style={{objectFit:"contain",flexShrink:0}} onError={()=>setFailed(old=>[...old,src])}/><span>{name}</span></span>;}
  return <span className={small?"nb-brand-name nb-brand-name-small":"nb-brand-name"}>{name}</span>;
 }
 return <span className={small?"nb-brand-mark nb-brand-mark-small":"nb-brand-mark"} title={media.logoAttribution+" · Brand identification only; dealer authorisation not implied"}>
  <Image src={media.logo} alt={name+" brand logo · brand identification, not dealership proof"}
   width={small?88:145} height={small?33:54} sizes={small?"88px":"145px"} unoptimized referrerPolicy="no-referrer"
   onError={()=>setFailed(old=>old.includes(media.logo)?old:[...old,media.logo])}
   style={{objectFit:"contain",maxWidth:"100%",height:small?33:54,width:small?88:145}}/>
 </span>;
}
