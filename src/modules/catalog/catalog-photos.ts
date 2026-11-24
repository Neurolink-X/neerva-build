import type {DemoProduct} from "./marketplace.ts";
import {aggregateReference,aggregatePhotoSources} from "./aggregate-references.ts";
import {hardwareReference} from "./hardware-references.ts";
import {localBrandAsset} from "./brand-media.ts";
import {paintReference} from "./paint-references.ts";
import {tileReferenceMedia} from "./tile-references.ts";
import {categoryImage} from "./public-products.ts";

import {curatedPhotoPaths} from "./curated-photo-paths.ts";
export type CatalogPhoto={src:string;label:string;alt:string;kind:"sku"|"listing"|"editorial"|"manufacturer"|"category"};
const curated:Record<string,string[]>={
 "plumbing:cpvc-pipe-25mm":["pipe-stack","pipe-install"],
 "plumbing:upvc-pipe-110mm":["pipe-install","pipe-stack"],
 "plumbing:astral-cpvc-pro-range":["pipe-stack","pipe-install"],
 "plumbing:generic-cpvc":["pipe-stack","pipe-install"],
 "plumbing:generic-upvc":["pipe-install","pipe-stack"],
 "plumbing:generic-plumbing-fitting":["plumbing-fitting","pipe-install"],
 "plumbing:generic-hdpe":["pipe-stack"],
 "steel:fe-500d-tmt-12mm":["steel-close","steel-bundle"],
 "steel:fe-500d-tmt-10mm":["steel-bundle","steel-close"],
 "steel:generic-fe500d":["steel-close","steel-bundle"],
 "steel:generic-fe550d":["steel-bundle","steel-close"],
 "bricks-blocks:red-clay-brick":["bricks-red"],
 "bricks-blocks:generic-clay":["bricks-red"],


 "cement:opc-cement-53-grade":["cement-stack"],
 "cement:generic-cement":["cement-stack"],
 "electrical:frls-wire-15sqmm":["wire-coil","wire-install"],
 "electrical:generic-wire":["wire-coil","wire-install"],
 "plumbing:generic-upvc-pressure":["pipe-stack"],
 "plumbing:generic-tee":["plumbing-fitting"],
 "plumbing:generic-coupler":["plumbing-fitting"]
};
function editorialKeys(p:DemoProduct):string[]{return curated[p.category+":"+p.slug]??(p.familyKey?curated[p.category+":"+p.familyKey]:undefined)??[];}
function approvedSkuImage(path:string):boolean{return /^\/images\/catalog\/sku\/[a-z0-9][a-z0-9/_-]{3,160}\.(?:webp|avif|png|jpe?g)$/i.test(path)&&!path.includes("..");}
export function catalogPhotos(product:DemoProduct):CatalogPhoto[]{
 const entries:CatalogPhoto[]=[];
 const append=(src:string|undefined|null,label:string,kind:CatalogPhoto["kind"],alt:string)=>{
  if(src&&!entries.some(x=>x.src===src))entries.push({src,label,kind,alt});
 };
 if(product.verification==="merchant_verified"&&product.imageVerified)
  for(const src of product.images??[])if(approvedSkuImage(src))
   append(src,"Verified seller photo","sku","Seller-reviewed photo of "+product.name);
 if(product.referenceImage)append(product.referenceImage,
  product.familyKey?"Product range":"Product photo",
  "listing","Reference photo of "+product.name+"; exact physical variant unverified");
 if(product.category==="aggregates"){
  const ref=aggregateReference(product.slug);
  if(ref){const photo=aggregatePhotoSources[ref.group];append(photo.src,"Representative material photo · not exact SKU","editorial",photo.alt);}
  append(categoryImage("aggregates"),"Material samples · illustrative comparison","category","Illustrative samples of construction sand and stone aggregate");
  return entries;
 }
 if(product.category==="hardware"){
  const ref=hardwareReference(product.slug);
  if(ref?.image)append(localBrandAsset(ref.image),"Retailer product reference","listing",product.name+" reference photograph");
  return entries;
 }
 if(product.category==="paint"){
  const paint=paintReference(product.slug);
  if(paint?.image)append(paint.image,"Manufacturer product photograph","manufacturer",product.name+" manufacturer pack reference");
  return entries; // Never show another paint brand's packaging for missing assets.
 }
 if(product.category==="tiles"){
  const tile=tileReferenceMedia(product.slug);
  if(tile?.swatch)append(tile.swatch,"Manufacturer surface sample","manufacturer",product.name+" surface pattern");
  if(tile?.room)append(tile.room,"Manufacturer room visualisation","manufacturer",product.name+" manufacturer room visualisation");
  return entries; // No unrelated tile image as a substitute for a named design.
 }
 if(entries.length)return entries;
 if(product.familyKey==="generic-hollow"||product.slug==="aac-block-600x200"){
  const hollow=product.familyKey==="generic-hollow";
  append("/images/catalog/material/"+(hollow?"hollow":"aac")+".webp","Material illustration","category",hollow?"Hollow concrete masonry block with open cores":"Solid aerated concrete masonry block");
  return entries;
 }
 if(product.familyKey==="generic-fly-ash"){
  append("/images/catalog/material/fly-ash.webp","Fly-ash brick · illustrative view","category","Illustrative solid grey fly-ash masonry bricks");
  return entries;
 }
 for(const key of editorialKeys(product)){
  const src=curatedPhotoPaths[key];
  append(src,"Real material photo · not exact SKU","editorial",
   "Real-world photograph of "+product.category.replaceAll("-"," ")+" materials, not the exact "+product.name);
 }
 if(!entries.length && product.category!=="bricks-blocks" && product.category!=="cement" && product.category!=="plumbing" && !(product.category==="electrical"&&/conduit|cable duct|casing and capping|cable protection|junction box/i.test(product.name)))
  append(categoryImage(product.category),"Material example","category","Representative "+product.category+" material");
 return entries;
}
export function catalogCardPhoto(product:DemoProduct):CatalogPhoto|undefined{
 const all=catalogPhotos(product);
 return all.find(p=>p.kind==="sku")??all.find(p=>p.kind==="listing")??all.find(p=>p.kind==="editorial")??all[0];
}

