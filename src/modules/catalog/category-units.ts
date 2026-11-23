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
