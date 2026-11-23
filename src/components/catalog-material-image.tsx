import Image from "next/image";
import type {DemoProduct} from "@/modules/catalog/marketplace";
import {categoryImage} from "@/modules/catalog/public-products";
import {productEvidence} from "@/modules/catalog/discovery";
import {brandMediaFor} from "@/modules/catalog/brand-media";

/** Exact manufacturer-image display is allowed only for reviewed LOCAL SKU media.
 * Copyright, correct pack variant and manufacturer permission must be verified
 * at upload time; unapproved external images are never mirrored/hotlinked.
 */
export function isApprovedSkuPhoto(path:string):boolean{
 return /^\/images\/catalog\/sku\/[a-z0-9][a-z0-9/_-]{3,160}\.(?:webp|avif|png|jpe?g)$/i.test(path)
  && !path.includes("..");
}
export function CatalogMaterialImage({category,name,compact=false,product}:{
 category:string;name:string;compact?:boolean;product?:DemoProduct
}){
 const proof=product?productEvidence(product):null;
 const exact=proof?.actualPhoto&&product?.images?.find(isApprovedSkuPhoto);
 const media=product?brandMediaFor(product.brand):null;
 const referencePhoto=category==="cement"&&media&&"pressPhoto" in media?media.pressPhoto:null;
 const src=exact||referencePhoto||categoryImage(category);
 return <div className={compact?"catalog-material-image compact":"catalog-material-image"}>
  {src?<Image src={src} alt={exact?`Verified photograph of ${name}`:referencePhoto?`Official manufacturer media-kit cement bag image for ${product?.brand}; not verified as the exact ${name} SKU`:`Representative ${category.replaceAll("-"," ")} ${src?.endsWith(".svg")?"illustration":"material photo"}; not the exact ${name} branded SKU`}
    fill sizes="(max-width:680px) 100vw, (max-width:1100px) 50vw, 33vw"
    quality={76} unoptimized={Boolean(referencePhoto)} loading="lazy"/>:
   <div className="catalog-image-awaiting" role="img" aria-label={`Actual ${name} product photograph awaiting manufacturer or dealer verification`}>
    <span>Verified product photo pending</span><small>Confirm SKU and packaging with the dealer</small>
   </div>}
  <span className="catalog-image-note">{exact?"Exact SKU photo · reviewed":referencePhoto?"Official manufacturer packaging reference · not exact SKU":src?src.endsWith(".svg")?"Illustrative sample · not exact SKU":"Material category photo · not exact SKU":"Image pending review"}</span>
 </div>;
}
