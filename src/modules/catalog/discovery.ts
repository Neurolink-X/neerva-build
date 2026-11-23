import type {DemoProduct} from "./marketplace.ts";
export type ProductFilters={query:string;category:string;brand:string;gradeOrSize:string};
export function productSearchText(p:DemoProduct):string{
 return [p.name,p.brand,p.category,p.description,...p.specifications.flatMap(s=>[s.label,s.value])].join(" ").toLocaleLowerCase("en-IN");
}
export function productFacetValues(products:readonly DemoProduct[],category="all"){
 const subset=products.filter(p=>category==="all"||p.category===category);
 const brandOptions=[...new Set(subset.map(p=>p.brand))].sort((a,b)=>a.localeCompare(b));
 const options=[...new Set(subset.flatMap(p=>p.specifications.filter(s=>/grade|diameter|nominal size|format|pack|size/i.test(s.label))
  .map(s=>s.value)).filter(v=>v.length<=45))].sort();
 return {brands:brandOptions,gradesAndSizes:options};
}
export function filterCatalog(products:readonly DemoProduct[],f:ProductFilters):DemoProduct[]{
 const search=f.query.toLocaleLowerCase("en-IN").trim();
 return products.filter(p=>
  (f.category==="all"||p.category===f.category)&&
  (f.brand==="all"||p.brand===f.brand)&&
  (f.gradeOrSize==="all"||p.specifications.some(s=>s.value===f.gradeOrSize))&&
  (!search||productSearchText(p).includes(search)));
}
export function productEvidence(p:DemoProduct):{exactSku:boolean;actualPhoto:boolean;inventoryVerified:boolean}{
 return {exactSku:p.verification==="merchant_verified"&&Boolean(p.manufacturerSku),
  actualPhoto:p.verification==="merchant_verified"&&p.imageVerified===true&&Boolean(p.images?.length),
  inventoryVerified:false};
}
