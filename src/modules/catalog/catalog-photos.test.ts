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


test("approved family assets require distinct views, reviewed rights, local files and matching fingerprints",async()=>{const {approvedMedia}=await import("./approved-family-media.ts");const {readFileSync}=await import("node:fs");const {createHash}=await import("node:crypto");const hashes=new Set<string>();const angles=new Set<string>();for(const m of approvedMedia){assert.equal(m.verified,true);assert.ok(m.license.trim()&&m.credit.trim()&&(m.licenseUrl.startsWith("https://creativecommons.org/")||m.license==="Public domain dedication"&&m.licenseUrl===m.sourceUrl&&m.sourceUrl.startsWith("https://commons.wikimedia.org/wiki/File:"))&&m.alt.trim()&&m.sourceUrl.startsWith("https://"));assert.match(m.path,/^\/images\/catalog\/approved\/[a-f0-9]{24}\.webp$/);assert.ok(m.width>=320&&m.height>=240&&m.bytes<=350000);const bytes=readFileSync("public"+m.path);assert.equal(bytes.length,m.bytes);assert.equal(createHash("sha256").update(bytes).digest("hex"),m.sha256);assert.equal(hashes.has(m.sha256),false);hashes.add(m.sha256);const key=m.category+":"+m.family+":"+m.view;assert.equal(angles.has(key),false);angles.add(key);assert.ok(demoProducts.some(p=>p.category===m.category&&(m.scope==="sku"?p.slug===m.family:(p.familyKey??p.slug)===m.family)));}});
test("unreviewed aggregate and generic pipe ranges never borrow unrelated category photos",()=>{for(const p of demoProducts.filter(p=>p.category==="aggregates"||p.familyKey==="generic-hdpe"||p.familyKey==="generic-tee"))assert.ok(catalogPhotos(p).every(m=>!m.src.includes("aggregates-samples")&&!m.src.includes("pipe-stack")&&!m.src.includes("plumbing-fitting")),p.slug);});


test("reviewed image sets have exactly one primary, byte-decoded dimensions and honest scopes",async()=>{const {approvedMedia}=await import("./approved-family-media.ts");const {approvedFamilyMedia,fittingDepartment}=await import("./media-integrity.ts");const {fittingReferences}=await import("./fitting-references.ts");const {readFileSync}=await import("node:fs");const sharp=(await import("sharp")).default;const counts=new Map<string,number>();for(const m of approvedMedia){const info=await sharp(readFileSync("public"+m.path)).metadata();assert.equal(info.format,"webp");assert.equal(info.width,m.width);assert.equal(info.height,m.height);assert.ok(m.path.includes(m.sha256.slice(0,24)));const key=[m.category,m.scope,m.family].join(":");counts.set(key,(counts.get(key)??0)+Number(m.primary));}for(const [key,n] of counts)assert.equal(n,1,key);const g=demoProducts.find(p=>p.slug==="gitti-20mm")!;assert.ok(approvedFamilyMedia(g).length>=2);assert.equal(approvedFamilyMedia(g)[0].primary,true);assert.equal(fittingDepartment(fittingReferences.find(r=>r.slug==="fitting-tank-nipple")!),"tank");assert.equal(fittingDepartment(fittingReferences.find(r=>r.slug==="fitting-elbow90")!),"pipe");assert.equal(fittingDepartment(fittingReferences.find(r=>r.slug==="fitting-pressure-switch")!),"pump");});


test("bulk stockpile references never masquerade as river or nominal-size stone",()=>{const concrete=demoProducts.find(p=>p.slug==="concrete-sand")!;const river=demoProducts.find(p=>p.slug==="river-sand-bulk")!;const coarse=demoProducts.find(p=>p.slug==="crushed-aggregate-bulk")!;assert.ok(concrete.quoteOnly);assert.ok(catalogPhotos(concrete).some(m=>m.sourceUrl?.includes("Concrete_sand_stockpile")));assert.ok(catalogPhotos(coarse).some(m=>m.sourceUrl?.includes("Crushed_stones_gravel")));assert.ok(catalogPhotos(river).every(m=>!m.sourceUrl?.includes("Concrete_sand_stockpile")));});


test("PVC elbow photographs stay separate from branded CPVC fittings",()=>{const generic=demoProducts.find(p=>p.familyKey==="generic-pvc-elbow90")!;const cpvc=demoProducts.find(p=>p.slug==="fitting-elbow90")!;assert.ok(catalogPhotos(generic).some(m=>m.sourceUrl?.includes("PvcElbows")));assert.ok(catalogPhotos(cpvc).every(m=>!m.sourceUrl?.includes("PvcElbows")));assert.ok(catalogPhotos(demoProducts.find(p=>p.slug==="fitting-float-valve")!).some(m=>m.sourceUrl?.includes("Ball_valve_cold_water_tank")));});


test("generic pump parts retain correct image identity without guessed brands",()=>{for(const [slug,source] of [["fitting-hose-clamp","Hoseclamps.screw.agr"],["fitting-mechanical-seal","Mechanical_seal_part01"]]){const p=demoProducts.find(p=>p.slug===slug)!;assert.equal(p.brand,"Local supplier");assert.ok(catalogPhotos(p).some(m=>m.sourceUrl?.includes(source)));}});


test("downloaded tool, garden hose and pressure gauge stay on their own families",()=>{for(const [family,source] of [["generic-garden-hose","Garden_hose.jpg"],["spirit-level","Tool-level.jpg"],["fitting-pressure-gauge","Pressure_gauge.jpg"]]){const p=demoProducts.find(p=>(p.familyKey??p.slug)===family)!;assert.ok(p,family);const m=catalogPhotos(p).find(x=>x.sourceUrl?.endsWith(source));assert.ok(m,family);assert.equal(m.kind,"editorial");assert.ok(m.src.startsWith("/images/catalog/approved/"));}const suction=demoProducts.find(p=>p.familyKey==="generic-suction-hose")!;assert.ok(catalogPhotos(suction).every(m=>!m.sourceUrl?.endsWith("Garden_hose.jpg")));});

test("customer category shortcuts open existing distinct catalog products and use local category images",async()=>{
 const {categoryChoices,categorySecondaryImages,categoryChoiceHref}=await import("./category-discovery.ts");
 const {categoryImage}=await import("./public-products.ts");
 const {getProduct}=await import("./marketplace.ts");
 const fs=await import("node:fs");
 for(const [category,choices] of Object.entries(categoryChoices)){
  assert.equal(new Set(choices.map(c=>c.slug)).size,choices.length);
  for(const choice of choices){assert.ok(getProduct(category,choice.slug),categoryChoiceHref(category,choice.slug));assert.ok(choice.hi&&choice.en);}
  const src=categoryImage(category);assert.ok(src&&fs.existsSync("public"+src));
  for(const photo of categorySecondaryImages[category]??[])assert.ok(fs.existsSync("public"+photo),photo);
 }
 assert.equal(categoryChoices["bricks-blocks"][0].slug,"red-clay-brick");
});

test("generated visuals are separate from real photos, lightweight and exactly mapped",async()=>{
 const {generatedVisuals}=await import("./generated-visuals.ts");const {catalogVisuals}=await import("./catalog-visuals.ts");const {readFileSync}=await import("node:fs");const {createHash}=await import("node:crypto");const sharp=(await import("sharp")).default;
 const paths=new Set<string>();for(const m of generatedVisuals){assert.ok(!paths.has(m.path));paths.add(m.path);const p=demoProducts.find(p=>p.category===m.category&&(p.familyKey??p.slug)===m.family);assert.ok(p,m.family);const bytes=readFileSync("public"+m.path);assert.ok(bytes.length<=35000);assert.equal(bytes.length,m.bytes);assert.equal(createHash("sha256").update(bytes).digest("hex"),m.sha256);const meta=await sharp(bytes).metadata();assert.equal(meta.format,"webp");assert.equal(meta.width,m.width);assert.equal(meta.height,m.height);assert.ok(!catalogPhotos(p).some(x=>x.src===m.path));if(/^(?:local\b|brand to confirm$|dealer-listed brand$|mill to confirm$)/i.test(p.brand)&&!catalogPhotos(p).some(x=>x.src.startsWith("/")&&x.kind!=="category"))assert.ok(catalogVisuals(p).some(x=>x.src===m.path&&x.kind==="generated"));}
});

 test("new pipe and hardware visuals resolve only their explicit generic product families",async()=>{
 const {catalogVisuals}=await import("./catalog-visuals.ts");
 for(const family of ["generic-pex","generic-casing","generic-rainwater","generic-underground-drain","generic-suction-hose","fitting-saddle","fitting-grommet","fitting-gi-nipple","fitting-pressure-switch","fitting-float-switch","fitting-pump-union","fitting-strainer","wood-adhesive","door-pull-handle","door-floor-spring","window-friction-stay"]){
 const variants=demoProducts.filter(p=>(p.familyKey??p.slug)===family);assert.ok(variants.length,family);
 for(const p of variants){const media=catalogVisuals(p);if(catalogPhotos(p).some(x=>x.src.startsWith("/")&&x.kind!=="category")){assert.ok(media.every(m=>m.kind!=="generated"),p.slug);continue;}if(!/^(?:local\b|brand to confirm$|dealer-listed brand$|mill to confirm$)/i.test(p.brand)){assert.ok(media.every(m=>m.kind!=="generated"),p.slug);continue;}assert.equal(media[0]?.kind,"generated",p.slug);assert.equal(media[0]?.src,"/images/catalog/generated/"+family+".webp",p.slug);assert.match(media[0]?.label??"",/AI-generated/);}
 }
 });


test("construction-first catalog filters small accessories without deleting direct product routes",async()=>{
 const {isPublicConstructionProduct}=await import("./discovery-policy.ts");
 const {getProduct}=await import("./marketplace.ts");
 for(const [category,slug] of [["hardware","wood-adhesive"],["hardware","tile-grout-sponge"],["hardware","fevikwik-203"],["plumbing","fitting-gasket"]]){const p=getProduct(category,slug);assert.ok(p,slug);assert.equal(isPublicConstructionProduct(p),false,slug);}
 for(const [category,slug] of [["hardware","roff-t01-nca"],["hardware","door-mortise-lock"],["plumbing","generic-cpvc-20mm"],["plumbing","fitting-float-valve"],["plumbing","fitting-elbow90"],["bricks-blocks","red-clay-brick"]]){const p=getProduct(category,slug);assert.ok(p,slug);assert.equal(isPublicConstructionProduct(p),true,slug);}
});


test("family home concepts are distinct local lightweight WebP images, not exact plan renders",async()=>{const {familyHomeVisuals}=await import("../home/family-home-visuals.ts");const {readFileSync}=await import("node:fs");const {createHash}=await import("node:crypto");const sharp=(await import("sharp")).default;assert.deepEqual(Object.keys(familyHomeVisuals).sort(),["15x30","18x50","20x40"]);const hashes=new Set<string>();for(const m of Object.values(familyHomeVisuals)){const bytes=readFileSync("public"+m.src);assert.equal(bytes.length,m.bytes);assert.ok(bytes.length<=30000);assert.equal(createHash("sha256").update(bytes).digest("hex"),m.sha256);const info=await sharp(bytes).metadata();assert.equal(info.format,"webp");assert.equal(info.width,m.width);assert.equal(info.height,m.height);assert.ok(!hashes.has(m.sha256));hashes.add(m.sha256);assert.match(m.source,/AI-generated architectural inspiration/);}});

test("source-confirmed licensed references are locally stored and restricted to matching generic families",async()=>{
 const {sourceConfirmedPhotos}=await import("./source-confirmed-photos.ts");
 const {readFileSync}=await import("node:fs");
 const {createHash}=await import("node:crypto");
 const sharp=(await import("sharp")).default;
 for(const m of sourceConfirmedPhotos){
  const bytes=readFileSync("public"+m.path);assert.equal(bytes.length,m.bytes);assert.equal(createHash("sha256").update(bytes).digest("hex"),m.sha256);
  const info=await sharp(bytes).metadata();assert.equal(info.width,m.width);assert.equal(info.height,m.height);
  assert.ok(m.licenseUrl.startsWith("https://creativecommons.org/")&&m.credit&&m.sourceUrl.startsWith("https://commons.wikimedia.org/wiki/File:"));
  const matches=demoProducts.filter(p=>p.category===m.category&&(p.familyKey??p.slug)===m.family);
  assert.ok(matches.length,m.family);for(const p of matches)assert.ok(catalogPhotos(p).some(x=>x.src===m.path&&x.kind==="editorial"&&x.label.includes("not exact SKU")));
  assert.ok(demoProducts.filter(p=>p.category!==m.category||(p.familyKey??p.slug)!==m.family).every(p=>catalogPhotos(p).every(x=>x.src!==m.path)));
 }
});


test("cement discovery uses local branded pack and red clay never uses mixed grey brick photo",async()=>{
 const {categoryImage}=await import("./public-products.ts");
 const {catalogVisuals}=await import("./catalog-visuals.ts");
 const {readFileSync}=await import("node:fs");
 assert.equal(categoryImage("cement"),"/images/catalog/reference/ultratech-ppc-cement.webp");
 for(const path of [categoryImage("cement")!,"/images/catalog/reference/acc-suraksha-power-ppc-cement-50-kg-bag.webp","/images/catalog/clay-bricks.webp"]){
  const bytes=readFileSync("public"+path);assert.ok(bytes.length>5000&&bytes.length<100000,path);
 }
 const clay=demoProducts.filter(p=>p.category==="bricks-blocks"&&(p.slug==="red-clay-brick"||p.familyKey==="generic-clay"));
 assert.ok(clay.length>0);
 for(const p of clay){const media=catalogVisuals(p);assert.equal(media[0]?.src,"/images/catalog/clay-bricks.webp",p.slug);assert.match(media[0]?.label??"",/illustrative/);assert.ok(media.every(m=>!m.src.endsWith("/bricks-red.jpg")));}
 const acc=demoProducts.find(p=>p.slug==="opc-cement-53-grade")!;assert.ok(catalogPhotos(acc).every(m=>!m.src.endsWith("/cement-stack.jpg")));
});
