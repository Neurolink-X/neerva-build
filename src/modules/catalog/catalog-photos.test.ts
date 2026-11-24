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

test("all locally licensed editorial images are present, JPEG, unique and substantial",async()=>{
 const {curatedPhotoPaths}=await import("./curated-photo-paths.ts");
 const fs=await import("node:fs");
 const crypto=await import("node:crypto");
 const paths=Object.values(curatedPhotoPaths);
 assert.equal(paths.length,10,"PR30 only displays photo assets after import and verification");
 const fingerprints=new Set<string>();
 for(const p of paths){
  assert.match(p,/^\/images\/catalog\/editorial\/[a-z-]+\.jpg$/);
  const bytes=fs.readFileSync("public"+p);
  assert.ok(bytes.length>15000&&bytes.length<2200000,p);
  assert.equal(bytes[0],255);assert.equal(bytes[1],216);assert.equal(bytes[2],255);
  fingerprints.add(crypto.createHash("sha256").update(bytes).digest("hex"));
 }
 assert.equal(fingerprints.size,paths.length,"no repeated binary editorial images");
});


test("pack galleries stay on the selected product and fly-ash never shows clay",()=>{
 const acc=demoProducts.find(p=>p.slug==="acc-suraksha-power-ppc-cement-50-kg-bag")!;
 assert.deepEqual(catalogPhotos(acc).map(p=>p.src),[acc.referenceImage]);
 for(const brick of technicalOptions.filter(p=>p.familyKey==="generic-fly-ash"))
  assert.deepEqual(catalogPhotos(brick).map(p=>p.src),["/images/catalog/material/fly-ash.webp"]);
});


test("approved family assets require distinct views, reviewed rights, local files and matching fingerprints",async()=>{const {approvedMedia}=await import("./approved-family-media.ts");const {readFileSync}=await import("node:fs");const {createHash}=await import("node:crypto");const hashes=new Set<string>();const angles=new Set<string>();for(const m of approvedMedia){assert.equal(m.verified,true);assert.ok(m.license.trim()&&m.alt.trim()&&m.sourceUrl.startsWith("https://"));assert.match(m.path,/^\/images\/catalog\/approved\/[a-f0-9]{24}\.webp$/);assert.ok(m.width>=320&&m.height>=240&&m.bytes<=350000);const bytes=readFileSync("public"+m.path);assert.equal(bytes.length,m.bytes);assert.equal(createHash("sha256").update(bytes).digest("hex"),m.sha256);assert.equal(hashes.has(m.sha256),false);hashes.add(m.sha256);const key=m.category+":"+m.family+":"+m.view;assert.equal(angles.has(key),false);angles.add(key);assert.ok(demoProducts.some(p=>p.category===m.category&&(m.scope==="sku"?p.slug===m.family:(p.familyKey??p.slug)===m.family)));}});
test("unreviewed aggregate and generic pipe ranges never borrow unrelated category photos",()=>{for(const p of demoProducts.filter(p=>p.category==="aggregates"||p.familyKey==="generic-hdpe"||p.familyKey==="generic-tee"))assert.ok(catalogPhotos(p).every(m=>!m.src.includes("aggregates-samples")&&!m.src.includes("pipe-stack")&&!m.src.includes("plumbing-fitting")),p.slug);});
