import test from "node:test";
import assert from "node:assert/strict";
import type {DemoProduct} from "./marketplace.ts";
import {groupCatalogByPhoto,rangeVariantLabel} from "./media-usage.ts";
const item=(slug:string,brand="JSW Neosteel",image="/images/catalog/reference/jsw-550d-range.webp"):DemoProduct=>({
 slug,brand,category:"steel",name:"Rebar "+slug,description:"",verification:"reference",
 referenceImage:image,specifications:[{label:"Diameter",value:slug+" mm"}]
});
test("same brand range photograph produces one card with individually linked sizes",()=>{
 const groups=groupCatalogByPhoto([item("8"),item("12"),item("16")]);
 assert.equal(groups.length,1);
 assert.deepEqual(groups[0].variants.map(rangeVariantLabel),["8 mm","12 mm","16 mm"]);
});
test("different brands, categories and images must never be merged",()=>{
 const x=item("8"),y=item("12","Other brand"),z={...item("16"),category:"hardware"},a=item("20","JSW Neosteel","/images/catalog/reference/different.webp");
 assert.equal(groupCatalogByPhoto([x,y,z,a]).length,4);
});
test("verified item photos and unphotographed items remain independent",()=>{
 const a={...item("8"),verification:"merchant_verified" as const,images:["/images/catalog/sku/jsw-8.webp"]};
 const b={...item("10"),verification:"merchant_verified" as const,images:["/images/catalog/sku/jsw-10.webp"]};
 const c={...item("12"),referenceImage:undefined},d={...item("16"),referenceImage:undefined};
 assert.equal(groupCatalogByPhoto([a,b,c,d]).length,4);
});
