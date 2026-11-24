"use client";
import {useState} from "react";
import Image from "next/image";
import type {DemoProduct} from "@/modules/catalog/marketplace";
import {categoryImage} from "@/modules/catalog/public-products";
import {catalogPhotos} from "@/modules/catalog/catalog-photos";
import {MaterialIdentity} from "./material-identity";
/** Card image: one factual badge, local first. No fake SKU imagery or unnecessary overlays. */
export function isApprovedSkuPhoto(path:string):boolean{
 return /^\/images\/catalog\/sku\/[a-z0-9][a-z0-9/_-]{3,160}\.(?:webp|avif|png|jpe?g)$/i.test(path)&&!path.includes("..");
}
export function CatalogMaterialImage({category,name,compact=false,product}:{category:string;name:string;compact?:boolean;product?:DemoProduct}){
 const [failed,setFailed]=useState<string[]>([]);
 const media=product?catalogPhotos(product):[];
 const sources=product?media:[{src:categoryImage(category),label:"Category photograph · not exact SKU",alt:"Representative "+category+" material photo",kind:"category" as const}];
 const current=sources.find(x=>x.src&&!failed.includes(x.src));
 const src=current?.src;
 // A real editorial photo is useful if its identity is explicitly labeled. Never render a
 // generic category photo as a particular fitting or cable conduit product.
 const isPipe=product&&(category==="plumbing"||category==="electrical")&&!product.referenceImage;
 const safeSrc=isPipe&&current?.kind==="category"?undefined:src;
 return <div className={"catalog-material-image"+(compact?" compact":"")+(current?.kind==="sku"||current?.kind==="listing"||current?.kind==="manufacturer"?" pack-photo":"")}>
  {safeSrc?<Image src={safeSrc} alt={compact?"":current?.alt??name} fill sizes="(max-width:680px) 100vw, (max-width:1100px) 50vw, 33vw"
   quality={75} loading="lazy" unoptimized={safeSrc.startsWith("https://")} referrerPolicy="no-referrer" onError={()=>setFailed(previous=>previous.includes(safeSrc)?previous:[...previous,safeSrc])}/>:
   <MaterialIdentity name={name} category={category} brand={product?.brand} product={product}/>}
  {!compact&&safeSrc&&<span className="catalog-image-note">{current?.label}</span>}
 </div>;
}

