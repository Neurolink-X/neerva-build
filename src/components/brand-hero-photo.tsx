"use client";
import Image from "next/image";
import {useState} from "react";
import {isLocalCatalogMedia} from "@/modules/catalog/local-media-policy";
import {MaterialIdentity} from "./material-identity";
export function BrandHeroPhoto({image,alt,label,fallback,fallbackAlt,product,name,category}:{image:string|null;alt:string;label:string;fallback:string|null;fallbackAlt:string;product:boolean;name:string;category:string}){
 const [failed,setFailed]=useState<string[]>([]);
 const src=[image,fallback].find((item):item is string=>isLocalCatalogMedia(item)&&!failed.includes(item));
 const primary=src===image;
 return <div className={"br-cover"+(product&&primary?" br-product":"")}>
 {src?<><Image src={src} alt={primary?alt:fallbackAlt} fill priority sizes="(max-width:620px) 95vw, 45vw"  referrerPolicy="no-referrer" onError={()=>setFailed(old=>old.includes(src)?old:[...old,src])}/><span className="br-photo-label">{primary?label:"Representative material photo · not brand packaging"}</span></>:<MaterialIdentity name={name} category={category}/>}
 </div>;
}
