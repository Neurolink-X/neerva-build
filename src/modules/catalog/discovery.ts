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
const searchIndex=new WeakMap<DemoProduct,string>();
const aliases:Record<string,string>={"सीमेंट":"cement","सरिया":"tmt","ईंट":"brick","पाइप":"pipe","बालू":"sand","मौरंग":"sand","गिट्टी":"aggregate","पेंट":"paint","टाइल":"tile","टाइल्स":"tiles","बिजली":"electrical","saria":"tmt","sariya":"tmt","eent":"brick","balu":"sand","gitti":"aggregate"};
export function normalizeMaterialSearch(value:string){
 return value.normalize("NFKC").toLocaleLowerCase("en-IN")
 .replace(/([0-9])(?=[a-z])/g,"$1 ").replace(/([a-z])(?=[0-9])/g,"$1 ")
 .replace(/[^\p{L}\p{M}\p{N}]+/gu," ").trim().split(/\s+/).filter(Boolean).map(t=>aliases[t]??t).join(" ");
}
function indexedText(p:DemoProduct){
 let value=searchIndex.get(p);
 if(value===undefined){value=normalizeMaterialSearch(productSearchText(p));searchIndex.set(p,value)}
 return value;
}
export function filterCatalog(products:readonly DemoProduct[],f:ProductFilters):DemoProduct[]{
 const tokens=normalizeMaterialSearch(f.query.slice(0,100)).split(" ").filter(Boolean);
 return products.filter(p=>
  (f.category==="all"||p.category===f.category)&&
  (f.brand==="all"||p.brand===f.brand)&&
  (f.gradeOrSize==="all"||p.specifications.some(s=>s.value===f.gradeOrSize))&&
  (!tokens.length||tokens.every(token=>indexedText(p).includes(token))));
}
export function productEvidence(p:DemoProduct):{exactSku:boolean;actualPhoto:boolean;inventoryVerified:boolean}{
 return {exactSku:p.verification==="merchant_verified"&&Boolean(p.manufacturerSku),
  actualPhoto:p.verification==="merchant_verified"&&p.imageVerified===true&&Boolean(p.images?.length),
  inventoryVerified:false};
}
