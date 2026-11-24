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

test("cement directory includes matching local product references for sourced brands",async()=>{
 const {directoryCards}=await import("./brand-pages.ts");
 const {existsSync}=await import("node:fs");
 const cards=directoryCards("cement");
 for(const name of ["ACC","UltraTech","JK Cement","Priya","Maha","Ramco","Birla Super"]){
  const card=cards.find(c=>c.name===name);
  assert.ok(card?.image,name+" needs a local product reference");
  assert.ok(existsSync("public"+card.image),name+" local product media");
  assert.ok(card.count>0);
 }
 for(const card of cards){
  if(card.image)assert.ok(demoProducts.some(p=>p.brand===card.name&&p.category==="cement"&&p.referenceImage===card.image));
 }
});


test("pipe expansion has distinct families, valid routes and source-linked manufacturer ranges",async()=>{
 const {getProduct, getProductsByCategory}=await import("./marketplace.ts");
 const {groupCatalogByPhoto}=await import("./media-usage.ts");
 for(const category of ["plumbing","electrical"]){
  const products=getProductsByCategory(category);
  const keys=new Set(products.map(p=>p.familyKey));
  const required=category==="plumbing"?["generic-cpvc","generic-upvc-pressure","generic-ppr","generic-pex","generic-column","generic-casing","generic-tee","generic-trap"]:["generic-conduit","generic-heavy-conduit","generic-flex-conduit","generic-dwc-duct","generic-junction-box","generic-casing-capping"];
  for(const key of required){assert.ok(keys.has(key),key);const variants=products.filter(p=>p.familyKey===key);assert.ok(variants.length>=2);for(const p of variants){assert.equal(getProduct(category,p.slug)?.slug,p.slug);assert.equal(productEvidence(p).inventoryVerified,false);}}
  assert.equal(groupCatalogByPhoto(products).flatMap(g=>g.variants).length,products.length);
 }
 for(const slug of ["astral-wireguard","supreme-cableshield","supreme-cableguard"]){const p=getProduct("electrical",slug);assert.ok(p?.manufacturerReference);assert.equal(p.referenceImage,undefined);}
});

test("priority brand marks retain attribution and range photographs are never exact SKU evidence",async()=>{
 const {brandMediaFor}=await import("./brand-media.ts");
 const {directoryCards}=await import("./brand-pages.ts");
 for(const name of ["Astral","Supreme","Ashirvad","Finolex","Polycab","KEI","Anchor Panasonic","Kajaria","Hettich","MYK Laticrete","Ambuja","Dalmia","Shree Cement"]){
  const media=brandMediaFor(name);assert.ok(media,name);
  assert.ok(media.logo.startsWith("https://")||media.logo.startsWith("/images/"));
  assert.match(media.logoSource,/^https:\/\//);assert.ok(media.logoAttribution);
 }
 for(const category of ["plumbing","electrical"]){
  for(const card of directoryCards(category)){
   assert.ok(card.familyCount<=card.count);
   if(card.rangeImage){assert.ok(card.rangeImage.startsWith("https://")||card.rangeImage.startsWith("/images/catalog/brand-local/"));assert.ok(card.rangeAlt&&card.rangeSource);}
  }
 }
});


test("local media manifest points only to existing bundled WebP assets",async()=>{
 const {localBrandAssets}=await import("./local-brand-assets.ts");
 const {existsSync}=await import("node:fs");
 for(const [source,path] of Object.entries(localBrandAssets)){
  assert.match(source,/^https:\/\//);assert.match(path,/^\/images\/catalog\/brand-local\/[a-f0-9]{24}\.webp$/);assert.ok(existsSync("public"+path),path);
 }
});


test("Kohinoor keeps its actual local product reference without substituting a namesake logo",async()=>{
 const {directoryCards}=await import("./brand-pages.ts");const {brandMediaFor}=await import("./brand-media.ts");const {existsSync}=await import("node:fs");
 const card=directoryCards("plumbing").find(c=>c.name==="Kohinoor");assert.ok(card);assert.equal(card.identity?.manufacturer,"Kohinoor Impex");assert.equal(card.identity?.logoStatus,"unconfirmed");assert.equal(brandMediaFor("Kohinoor"),null);assert.ok(card.image&&existsSync("public"+card.image));
});


test("manufacturer tile references have exact price source, unique routes and no fake stock",async()=>{const {tileReferences,tileReferencePrice}=await import("./tile-references.ts");const {catalogPhotos}=await import("./catalog-photos.ts");for(const t of tileReferences){const product=demoProducts.find(p=>p.slug===t.slug&&p.category==="tiles");assert.ok(product);assert.equal(tileReferencePrice(t.slug)?.rupees,t.mrp);assert.equal(tileReferencePrice(t.slug)?.source,product.manufacturerReference);assert.equal(productEvidence(product).inventoryVerified,false);if(t.swatch)assert.equal(catalogPhotos(product)[0]?.src,t.swatch);else assert.equal(catalogPhotos(product).length,0);}assert.equal(tileReferencePrice("kajaria-k-12631"),null);assert.equal(tileReferencePrice("orientbell-oak")?.rupees,149);});

test("aggregate catalog keeps private quotes, old routes and valid bulk quantities",async()=>{const {aggregateReferences,aggregateQuoteQuantity}=await import("./aggregate-references.ts");const {getProduct}=await import("./marketplace.ts");const {isAllowedCategoryUnit}=await import("./category-units.ts");assert.equal(aggregateReferences.length,16);for(const r of aggregateReferences){const p=getProduct("aggregates",r.slug);assert.ok(p?.quoteOnly);assert.equal(productEvidence(p).inventoryVerified,false);}assert.ok(getProduct("aggregates","river-sand-bulk"));assert.ok(getProduct("aggregates","crushed-aggregate-bulk"));const q=aggregateQuoteQuantity("100","cft");assert.equal(q?.quantity,"2.832");assert.ok(q&&isAllowedCategoryUnit("aggregates",q.unit));assert.equal(aggregateQuoteQuantity("1.5","truck"),null);assert.equal(aggregateQuoteQuantity("-1","tonne"),null);assert.equal(aggregateQuoteQuantity("","cubic_metre"),null);assert.equal(aggregateQuoteQuantity("10","bag"),null);});

test("paint manufacturer rates stay references, new products have routes and coverage estimator validates inputs",async()=>{const {paintReferences,paintReferencePrice,paintLitres}=await import("./paint-references.ts");const {getProduct}=await import("./marketplace.ts");const {catalogPhotos}=await import("./catalog-photos.ts");for(const r of paintReferences){const p=getProduct("paint",r.slug);assert.ok(p);assert.equal(p.manufacturerReference,r.source);assert.equal(productEvidence(p).inventoryVerified,false);if(r.mrp!==null)assert.equal(paintReferencePrice(r.slug)?.rupees,r.mrp);else assert.equal(paintReferencePrice(r.slug),null);if(r.image)assert.equal(catalogPhotos(p)[0]?.src,r.image);}assert.equal(paintReferencePrice("asian-paints-waterproof-putty"),null);assert.equal(paintReferencePrice("asian-paints-tractor-emulsion")?.rupees,209);assert.equal(paintLitres(1000,100,10),11);assert.equal(paintLitres(1000,0,10),null);assert.equal(paintLitres(1000,100,30),null);});


test("hardware references are unique, preserve route compatibility and exact listing price basis",async()=>{const {hardwareReferences,hardwarePrice,hardwareGroup}=await import("./hardware-references.ts");const {getProduct}=await import("./marketplace.ts");const {catalogPhotos}=await import("./catalog-photos.ts");assert.ok(hardwareReferences.length>=40);assert.equal(new Set(hardwareReferences.map(r=>r.slug)).size,hardwareReferences.length);const images=new Set<string>();for(const r of hardwareReferences){const p=getProduct("hardware",r.slug);assert.ok(p);assert.equal(productEvidence(p).inventoryVerified,false);assert.ok(hardwareGroup(r.slug));assert.ok(!/nut.?bolt/i.test(p.name));if(r.rupees!==null){assert.equal(hardwarePrice(r.slug)?.rupees,r.rupees);assert.ok(hardwarePrice(r.slug)?.source);}else assert.equal(hardwarePrice(r.slug),null);if(r.image){assert.ok(!images.has(r.image));images.add(r.image);const {usableMediaSource}=await import("./failed-media-sources.ts");if(usableMediaSource(r.image))assert.ok(catalogPhotos(p).length);else {const {approvedFamilyMedia}=await import("./media-integrity.ts");assert.deepEqual(catalogPhotos(p).map(m=>m.src),approvedFamilyMedia(p).map(m=>m.path),r.slug);}}else {const {approvedFamilyMedia}=await import("./media-integrity.ts");assert.deepEqual(catalogPhotos(p).map(m=>m.src),approvedFamilyMedia(p).map(m=>m.path),r.slug);}}assert.ok(getProduct("hardware","door-hinge-stainless-steel"));assert.ok(getProduct("hardware","tile-adhesive-c2"));});


test("shared fitting references have unique routes, compatibility and size-specific pricing",async()=>{const {fittingReferences,fittingPrice,isLegacyFitting}=await import("./fitting-references.ts");const {getProduct}=await import("./marketplace.ts");const {catalogPhotos}=await import("./catalog-photos.ts");assert.ok(fittingReferences.length>=40);assert.equal(new Set(fittingReferences.map(r=>r.slug)).size,fittingReferences.length);const images=new Set<string>();for(const r of fittingReferences){const p=getProduct("plumbing",r.slug);assert.ok(p&&r.hi&&r.compat&&r.sizes.length);assert.equal(productEvidence(p).inventoryVerified,false);assert.equal(getProduct("hardware",r.slug),undefined);if(r.image){assert.ok(!images.has(r.image));images.add(r.image);assert.ok(catalogPhotos(p).length);}else {const {approvedFamilyMedia}=await import("./media-integrity.ts");assert.deepEqual(catalogPhotos(p).map(m=>m.src),approvedFamilyMedia(p).map(m=>m.path),r.slug);}if(r.price){assert.ok(r.priceSize&&r.sizes.includes(r.priceSize));assert.equal(fittingPrice(r.slug)?.rupees,r.price);}}assert.ok(demoProducts.some(isLegacyFitting));});


test("requested tank and pump parts are covered without duplicate aliases",async()=>{const {fittingReferences,fittingReference,isLegacyFitting}=await import("./fitting-references.ts");const {getProduct}=await import("./marketplace.ts");for(const id of ["tank-lid","tank-inlet","tank-outlet","tank-drain","threaded-reducer","saddle-clamp","u-clamp","flex-connector","pump-adapter","motor-starter","pump-cable","anti-vibration","base-pad","gland-seal","hose-collar","elbow45"]){assert.ok(fittingReference("fitting-"+id),id);assert.ok(getProduct("plumbing","fitting-"+id));}assert.equal(fittingReferences.length,58);assert.ok(fittingReference("fitting-nrv")?.aliases?.includes("check valve"));assert.ok(fittingReference("fitting-ptfe")?.aliases?.includes("thread seal tape"));const old=getProduct("plumbing","ashirvad-elbow-half");assert.ok(old&&isLegacyFitting(old));});


test("failed remote media is excluded and pressure switch is not represented by an unconfirmed float-switch listing",async()=>{const {failedMediaSources,usableMediaSource}=await import("./failed-media-sources.ts");const {fittingReference,fittingPrice}=await import("./fitting-references.ts");assert.ok(failedMediaSources.size>=40);for(const source of failedMediaSources)assert.equal(usableMediaSource(source),false);assert.equal(fittingReference("fitting-pressure-switch")?.image,undefined);assert.equal(fittingPrice("fitting-pressure-switch"),null);});
