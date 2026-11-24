"use client";
import Image from "next/image";
import {useState} from "react";
export function BrandHeroPhoto({image,alt,label,fallback,fallbackAlt,product}:{image:string;alt:string;label:string;fallback:string|null;fallbackAlt:string;product:boolean}){
 const [failed,setFailed]=useState<string[]>([]);
 const src=[image,fallback].find((item):item is string=>Boolean(item&&!failed.includes(item)));
 const primary=src===image;
 return <div className={"br-cover"+(product&&primary?" br-product":"")}>
 {src?<><Image src={src} alt={primary?alt:fallbackAlt} fill priority sizes="(max-width:620px) 95vw, 45vw" unoptimized={src.startsWith("https://")} referrerPolicy="no-referrer" onError={()=>setFailed(old=>old.includes(src)?old:[...old,src])}/><span className="br-photo-label">{primary?label:"Representative material photo · not brand packaging"}</span></>:<div className="br-no-photo"><small>Product photograph unavailable</small></div>}
 </div>;
}
