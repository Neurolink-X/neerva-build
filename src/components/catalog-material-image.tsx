"use client";
import {useState} from "react";
import Image from "next/image";
import type {DemoProduct} from "@/modules/catalog/marketplace";
import {categoryImage} from "@/modules/catalog/public-products";
import {productEvidence} from "@/modules/catalog/discovery";
import {brandMediaFor} from "@/modules/catalog/brand-media";

/** Exact manufacturer-image display is allowed only for reviewed LOCAL SKU media.
 * If a verified local photo, press reference or CDN sample is inaccessible, use
 * the next factual source or an explicit unavailable message; never substitute
 * the wrong packaging and never imply official partnership.
 */
export function isApprovedSkuPhoto(path:string):boolean{
 return /^\/images\/catalog\/sku\/[a-z0-9][a-z0-9/_-]{3,160}\.(?:webp|avif|png|jpe?g)$/i.test(path)
  && !path.includes("..");
}
export function CatalogMaterialImage({category,name,compact=false,product}:{
 category:string;name:string;compact?:boolean;product?:DemoProduct
}){
 const [failed,setFailed]=useState<string[]>([]);
 const proof=product?productEvidence(product):null;
 const exact=proof?.actualPhoto&&product?.images?.find(isApprovedSkuPhoto);
 const media=product?brandMediaFor(product.brand):null;
 const referencePhoto=category==="cement"&&media&&"pressPhoto" in media?media.pressPhoto:null;
 const categoryPhoto=categoryImage(category);
 const sources=[exact||null,referencePhoto,categoryPhoto].filter((src):src is string=>Boolean(src));
 const src=[...new Set(sources)].find(value=>!failed.includes(value))??null;
 const exactSelected=Boolean(src&&src===exact);
 const pressSelected=Boolean(src&&src===referencePhoto&&!exactSelected);
 const alt=exactSelected? `Verified photo of ${name}`:
  pressSelected?`Manufacturer media-kit cement packaging reference for ${product?.brand}; not the exact ${name} SKU`:
  `Representative ${category.replaceAll("-"," ")} material photo; not the exact ${name} branded product`;
 return <div className={compact?"catalog-material-image compact":"catalog-material-image"}>
  {src?<Image src={src} alt={compact?"":alt}
    fill sizes="(max-width:680px) 100vw, (max-width:1100px) 50vw, 33vw"
    quality={76} unoptimized={pressSelected} loading="lazy"
    onError={()=>setFailed(old=>old.includes(src)?old:[...old,src])}/>:
   <div className="catalog-image-awaiting" role="img" aria-label={`Photograph of ${name} unavailable`}>
    <span>Material photo temporarily unavailable</span><small>Confirm exact product packaging and SKU with the dealer</small>
   </div>}
  <span className="catalog-image-note">{exactSelected?"Exact SKU photo · reviewed":pressSelected?"Manufacturer press reference · not exact SKU":src?"Representative material photo · not exact SKU":"Verified product photo unavailable"}</span>
 </div>;
}
