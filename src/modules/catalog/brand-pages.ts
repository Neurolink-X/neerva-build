import {brandDirectory, getCategory, getProductsByCategory} from "./marketplace.ts";
import {groupCatalogByPhoto} from "./media-usage.ts";
import {categoryImage} from "./public-products.ts";
import {localBrandAsset} from "./brand-media.ts";

export function brandSlug(name:string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
export const brandPath=(category:string,name:string)=>`/brands/${category}/${brandSlug(name)}`;
export const dealerPath=(category:string)=>`/brands/${category}/dealer-listings`;

export const buyingDetails:Record<string,string>={
  cement:"Compare cement type, grade and bag weight. Ask for the packing date and the delivered price per bag.",
  steel:"Compare steel grade, bar diameter and length. Confirm bundle weight and the basis for billing.",
  plumbing:"Match the pipe and fitting sizes, material and pressure class. Compare pipe rates per length and fitting rates per piece.",
  electrical:"Compare conductor size, insulation type and coil length. Ask for the exact product code in your quotation.",
  tiles:"Compare tile format, finish and coverage per carton. Confirm shade lot, breakage allowance and unloading charges.",
  hardware:"Match hinges by mounting type and overlay. For adhesives, check substrate compatibility and pack weight.",
  paint:"Choose an interior or exterior finish, then compare pack size, shade code, coverage and required primer.",
  aggregates:"Specify material, quantity and delivery access. Ask the dealer to itemize transport and unloading.",
  "bricks-blocks":"Compare block material, face dimensions and thickness. Confirm the unit count, transport and breakage terms."
};

// Reviewed range photographs: representative only; not exact SKU or a stock claim.
export const rangeMedia:Record<string,{image:string;alt:string;source:string}>={
 "cement:Ambuja":{image:"https://www.masonmart.in/cdn/shop/files/AMBUJA-CEMENT_-50KG.png?v=1754362527",alt:"Ambuja PPC cement 50 kg pack reference",source:"https://www.masonmart.in/products/ambuja-cement-ppc"},
 "cement:Dalmia":{image:"https://lntsufin.com/storage/mediafiles/catalog/live/16986-11282/original/16986-11282_image_0.jpg",alt:"Dalmia PPC cement 50 kg pack reference",source:"https://lntsufin.com/product/dalmia-ppc-cement-50-kg/16986-11282"},
 "steel:Jindal Panther":{image:"https://lntsufin.com/storage/mediafiles/catalog/live/17499-356/original/17499-356_image_0.jpg",alt:"Jindal Panther TMT rebar range reference",source:"https://lntsufin.com/product/jindal-panther-16-mm-fe-550-crs-tmt-bars-is-1786/17499-356"},
 "plumbing:Astral":{image:"https://5.imimg.com/data5/SELLER/Default/2023/12/370425940/TZ/FL/AB/8521096/astral-cpvc-pro-1000x1000.png",alt:"Astral CPVC Pro pipe and fitting range",source:"https://www.krishnapipes.in/astral-pipes.html"},
 "plumbing:Supreme":{image:"https://www.supreme.co.in/uploads/images/rYp2eJWqCU1H1V2HDsplxl8zEcIxNCcJcy7iH9dP.png",alt:"Supreme Lifeline CPVC pipes and fittings",source:"https://www.supreme.co.in/pipe/plumbing/products/lifeline-c-pvc-hot-cold-water-system-cts-series"},
 "electrical:Finolex":{image:"https://madhukarpipesandelectricals.com/images/pipe7.png",alt:"Finolex electrical conduit range",source:"https://madhukarpipesandelectricals.com/electrical-wires-and-cables-supplier-in-madurai-tamilnadu"},
 "electrical:Polycab":{image:"https://home-run.co/cdn/shop/files/w5.webp?v=1781092811&width=1024",alt:"Polycab FR-LSH single core wire range",source:"https://home-run.co/products/polycab-frls-h-single-core-wire"}
};
export function directoryCards(category:string){
  return brandDirectory.filter(b=>b.category===category).map(({name})=>{
    const products=getProductsByCategory(category).filter(p=>p.brand===name);
    const pictured=products.find(p=>p.referenceImage);
    const range=rangeMedia[category+":"+name];
    return {name,category,href:brandPath(category,name),count:products.length,familyCount:groupCatalogByPhoto(products).length,
      image:pictured?.referenceImage??null,alt:pictured?.name??"",rangeImage:range?localBrandAsset(range.image):null,rangeAlt:range?.alt??"",rangeSource:range?.source??null,
      detail:pictured?.name??products[0]?.name??`Request ${name} ${getCategory(category)?.title.toLowerCase()}`};
  });
}
export function categoryCover(category:string){
  return category==="plumbing"?"/images/catalog/editorial/pipe-stack.jpg":category==="tiles"?"/images/catalog/reference/pexels-photo-40080972.webp":categoryImage(category);
}
