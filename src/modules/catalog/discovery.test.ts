import test from "node:test";
import assert from "node:assert/strict";
import {demoProducts} from "./marketplace.ts";
import {catalogCategories} from "./catalog.ts";
import {filterCatalog,productFacetValues,productEvidence} from "./discovery.ts";
test("8+ construction categories and uniquely slugged brand/spec discovery examples",()=>{
 assert.ok(catalogCategories.length>=9);
 assert.equal(new Set(demoProducts.map(p=>p.category+":"+p.slug)).size,demoProducts.length);
 for(const p of demoProducts){
  assert.ok(catalogCategories.some(c=>c.slug===p.category));
  assert.ok(p.name.length>3&&p.brand.length>1&&p.specifications.length>=3);
  assert.equal(productEvidence(p).inventoryVerified,false);
  assert.equal(productEvidence(p).exactSku,false,"Reference item cannot claim an exact manufacturer SKU");
  assert.equal(productEvidence(p).actualPhoto,false,"Reference brand cannot claim an exact SKU photo");
 }
});
test("brand grade and size facets filter searchable technical specs",()=>{
 const f=productFacetValues(demoProducts,"steel");
 assert.ok(f.brands.includes("Tata Tiscon"));
 const result=filterCatalog(demoProducts,{category:"steel",brand:"Tata Tiscon",gradeOrSize:"all",query:"550SD"});
 assert.ok(result.some(x=>x.slug==="tata-tiscon-550sd-range"));
 const cement=filterCatalog(demoProducts,{category:"cement",brand:"all",gradeOrSize:"all",query:"PPC"});
 assert.ok(cement.length>=1);
 assert.deepEqual(filterCatalog(demoProducts,{category:"paint",brand:"all",gradeOrSize:"all",query:"will-never-match"}),[]);
});
