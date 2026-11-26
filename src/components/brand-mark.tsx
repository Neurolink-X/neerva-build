"use client";
import {useState} from "react";
import Image from "next/image";
import {brandMediaFor} from "@/modules/catalog/brand-media";
import {isLocalCatalogMedia} from "@/modules/catalog/local-media-policy";
import {usableMediaSource} from "@/modules/catalog/failed-media-sources";

/** Only reviewed public reference marks. A broken/blocked CDN URL falls back to
 * the actual brand name instead of a blank logo or a fabricated vector mark. */
export function BrandMark({name,small=false}:{name:string;small?:boolean}){
 const [failed,setFailed]=useState<string[]>([]);
 const media=brandMediaFor(name==="JSW"?"JSW Neosteel":name);
 if(!media||!isLocalCatalogMedia(media.logo)||!usableMediaSource(media.logo)||failed.includes(media.logo)){
  return <span className={small?"nb-brand-name nb-brand-name-small":"nb-brand-name"}>{name}</span>;
 }
 return <span className={small?"nb-brand-mark nb-brand-mark-small":"nb-brand-mark"} title={media.logoAttribution+" · Brand identification only; dealer authorisation not implied"}>
  <Image src={media.logo} alt={name+" brand logo · brand identification, not dealership proof"}
   width={small?88:145} height={small?33:54} sizes={small?"88px":"145px"} unoptimized referrerPolicy="no-referrer"
   onError={()=>setFailed(old=>old.includes(media.logo)?old:[...old,media.logo])}
   style={{objectFit:"contain",maxWidth:"100%",height:small?33:54,width:small?88:145}}/>
 </span>;
}
