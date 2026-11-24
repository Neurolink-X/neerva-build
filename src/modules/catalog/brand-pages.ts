import {brandDirectory, getCategory, getProductsByCategory} from "./marketplace.ts";
import {categoryImage} from "./public-products.ts";

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

export function directoryCards(category:string){
  return brandDirectory.filter(b=>b.category===category).map(({name})=>{
    const products=getProductsByCategory(category).filter(p=>p.brand===name);
    const pictured=products.find(p=>p.referenceImage);
    return {name,category,href:brandPath(category,name),count:products.length,
      image:pictured?.referenceImage??null,alt:pictured?.name??"",
      detail:pictured?.name??products[0]?.name??`Request ${name} ${getCategory(category)?.title.toLowerCase()}`};
  });
}
export function categoryCover(category:string){
  return category==="plumbing"?"/images/catalog/editorial/pipe-stack.jpg":category==="tiles"?"/images/catalog/reference/pexels-photo-40080972.webp":categoryImage(category);
}
