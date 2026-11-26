/** Shared canonical quantity-unit contract. Keep form, product choice and API in sync.
 * Units are descriptive procurement quantities, not stock guarantees or prices.
 */
export const categoryUnitOptions = {
  steel: ["kg","quintal","tonne","piece","bundle"],
  cement: ["bag","tonne"],
  "bricks-blocks": ["piece","bundle","truck"],
  plumbing: ["length","piece","bundle","metre"],
  electrical: ["coil","metre","piece","bundle","kg"],
  aggregates: ["cubic_metre","truck","tonne"],
  paint: ["litre","kg","bucket","piece"],
  tiles: ["box","square_foot","piece"],
  hardware: ["piece","box","kg","bag","bundle"]
} as const;
export type MaterialCategory = keyof typeof categoryUnitOptions;
export const quantityUnitLabels = {
 bag:"Bag", kg:"Kilogram (kg)", tonne:"Tonne", piece:"Piece", bundle:"Bundle",
 quintal:"Quintal", truck:"Truck", cubic_metre:"Cubic metre (m³)",
 length:"Length / pipe", coil:"Coil", metre:"Metre", litre:"Litre",
 bucket:"Bucket", box:"Box", square_foot:"Square foot (ft²)"
} as const;
export type MaterialQuantityUnit = keyof typeof quantityUnitLabels;
export const allMaterialUnits = Object.keys(quantityUnitLabels) as MaterialQuantityUnit[];
export const categoryMaterialHints: Record<MaterialCategory,string> = {
 steel:"Grade (Fe 500D/550D), diameter in mm and brand",
 cement:"Brand, PPC/OPC type, bag size and grade",
 "bricks-blocks":"Clay/AAC/fly ash, thickness and dimensions",
 plumbing:"CPVC/uPVC/HDPE, diameter, pressure class and length",
 electrical:"Cable size, insulation, wire length or conduit diameter",
 aggregates:"Balu/morang/aggregate size, source and vehicle quantity",
 paint:"Brand, indoor/outdoor, finish, colour/shade, pack size",
 tiles:"Brand, tile size in mm, finish, thickness and box coverage",
 hardware:"Type, brand, dimensions, weight and compatible application"
};
export function isMaterialCategory(category:string): category is MaterialCategory{
 return Object.prototype.hasOwnProperty.call(categoryUnitOptions,category);
}
export function categoryUnits(category:string): readonly MaterialQuantityUnit[]{
 return isMaterialCategory(category)?categoryUnitOptions[category]:[];
}
export function defaultCategoryUnit(category:string):MaterialQuantityUnit{
 return categoryUnits(category)[0]??"piece";
}
export function isAllowedCategoryUnit(category:string,unit:string):unit is MaterialQuantityUnit{
 return categoryUnits(category).some(value=>value===unit);
}

/** Counts of physical packages/items must be whole numbers. Measured quantities
 * can use up to three decimal places. Bulk increments are UI convenience only. */
const wholeUnits=new Set<string>(["bag","piece","bundle","truck","length","coil","bucket","box"]);
export function quantityPrecision(unit:string){return wholeUnits.has(unit)?1:.001;}
export function validUnitQuantity(unit:string,quantity:number){if(!allMaterialUnits.some(u=>u===unit)||!Number.isFinite(quantity)||quantity<quantityPrecision(unit)||quantity>1000000)return false;const scale=wholeUnits.has(unit)?1:1000;return Math.abs(quantity*scale-Math.round(quantity*scale))<.00001;}
export function validMaterialQuantity(category:string,unit:string,quantity:number){return isAllowedCategoryUnit(category,unit)&&validUnitQuantity(unit,quantity);}
export function materialUnitLabel(category:string,unit:string){if(category==="bricks-blocks"&&unit==="piece")return "Pieces (bricks / blocks)";return quantityUnitLabels[unit as MaterialQuantityUnit]??unit;}
export function quantityIncrement(category:string,slug:string,unit:string){if(category==="bricks-blocks"&&unit==="piece")return /aac|block|paver|hollow/.test(slug)?10:100;return 1;}
export function initialMaterialQuantity(category:string,slug:string,unit:string){return quantityIncrement(category,slug,unit);}
/** Only narrow, identifiable product families override category defaults. */
export function productUnits(category:string,slug:string):readonly MaterialQuantityUnit[]{
 const units=categoryUnits(category);
 if(category==="bricks-blocks")return ["piece","bundle","truck"];
 if(category==="plumbing"&&/elbow|coupler|coupling|reducer|socket|union|valve|clamp|adaptor|adapter|connector|nipple|grommet|tee|end-cap|plug|saddle|trap|bend|fitting|pressure-gauge|float-switch/.test(slug))return ["piece","bundle"];
 if(category==="electrical"&&/junction-box|conduit-bend|conduit-coupler|conduit-clamp|switch|socket|plug|mcb/.test(slug))return ["piece","bundle"];
 if(category==="electrical"&&/conduit|casing-capping|duct/.test(slug))return ["length","metre","piece","bundle"].filter((u):u is MaterialQuantityUnit=>units.some(x=>x===u));
 return units;
}
export function defaultProductUnit(category:string,slug:string):MaterialQuantityUnit{return productUnits(category,slug)[0]??defaultCategoryUnit(category);}
export function validProductQuantity(category:string,slug:string,unit:string,quantity:number){return productUnits(category,slug).some(u=>u===unit)&&validMaterialQuantity(category,unit,quantity);}
