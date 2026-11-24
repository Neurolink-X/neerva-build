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
   if(card.rangeImage){assert.match(card.rangeImage,/^https:\/\//);assert.ok(card.rangeAlt&&card.rangeSource);}
  }
 }
});
