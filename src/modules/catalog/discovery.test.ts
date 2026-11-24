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

test("sourced references use readable local media and keep stock separate",async()=>{
 const {existsSync}=await import("node:fs");
 for(const item of demoProducts.filter(p=>p.referenceImage)){
  assert.match(item.referenceImage!,/^\/images\/catalog\/reference\/[a-z0-9_-]+\.webp$/);
  assert.ok(existsSync("public"+item.referenceImage));
  assert.ok(item.referenceSource||item.manufacturerReference);
  assert.equal(productEvidence(item).inventoryVerified,false);
 }
 assert.ok(demoProducts.filter(p=>p.category==="cement"&&p.referenceSource).length>=8);
});

test("sourced brands open their catalog and unlisted brands prefill a quote",async()=>{
 const {brandDirectory,brandDestination}=await import("./marketplace.ts");
 for(const p of demoProducts.filter(p=>p.referenceImage)){
  assert.ok(brandDirectory.some(entry=>entry.name===p.brand && entry.category===p.category),p.name);
  const url=new URL(brandDestination(p.brand,p.category),"https://example.test");
  assert.equal(url.pathname,"/materials");
  assert.equal(url.searchParams.get("brand"),p.brand);
  assert.equal(url.searchParams.get("category"),p.category);
 }
 const request=new URL(brandDestination("Ambuja","cement"),"https://example.test");
 assert.equal(request.pathname,"/quotes");
 assert.equal(request.searchParams.get("material"),"Ambuja cement");
 const pipes=demoProducts.filter(p=>p.familyKey==="ashirvad-flowguard-sdr11");
 assert.equal(pipes.length,4);
 assert.equal(new Set(pipes.map(p=>p.specifications.find(s=>s.label==="Nominal size")?.value)).size,4);
});

test("brand directory paths resolve uniquely within every category and use the matching product image",async()=>{
 const {directoryCards,dealerPath}=await import("./brand-pages.ts");
 const paths=new Set<string>();
 for(const category of catalogCategories){
  for(const card of directoryCards(category.slug)){
   assert.ok(!paths.has(card.href));
   paths.add(card.href);
   assert.notEqual(card.href,dealerPath(category.slug));
   if(card.image)assert.ok(demoProducts.some(p=>p.category===category.slug&&p.brand===card.name&&p.referenceImage===card.image&&p.name===card.alt));
  }
 }
});
