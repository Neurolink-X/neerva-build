import test from "node:test";
import assert from "node:assert/strict";
import {catalogPhotos,catalogCardPhoto} from "./catalog-photos.ts";
import {technicalOptions} from "./technical-options.ts";
import {demoProducts} from "./marketplace.ts";
import {groupCatalogByPhoto} from "./media-usage.ts";
test("technical options add honest category depth",()=>{
 for(const category of ["plumbing","steel","bricks-blocks","cement","electrical"]){
  assert.ok(technicalOptions.filter(x=>x.category===category).length>=4,category);
 }
 assert.equal(new Set(technicalOptions.map(p=>p.category+":"+p.slug)).size,technicalOptions.length);
 assert.ok(technicalOptions.every(p=>p.verification==="reference"&&!p.imageVerified&&p.specifications.length>=3));
});
test("media source paths are unique within each product, never fake exact photos",()=>{
 for(const p of demoProducts){
  const photos=catalogPhotos(p);
  assert.equal(new Set(photos.map(x=>x.src)).size,photos.length,p.slug);
  assert.ok(photos.every(x=>x.kind!=="editorial"||x.label.includes("not exact SKU")));
  const first=catalogCardPhoto(p);
  if(first)assert.ok(photos.some(x=>x.src===first.src));
 }
});
test("family groups keep individual sizes available",()=>{
 const variants=technicalOptions.filter(x=>x.familyKey==="generic-cpvc");
 const grouped=groupCatalogByPhoto(variants);
 assert.equal(grouped.length,1);
 assert.equal(grouped[0].variants.length,variants.length);
});
