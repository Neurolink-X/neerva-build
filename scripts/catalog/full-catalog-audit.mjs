import {isPublicConstructionProduct} from "../../src/modules/catalog/discovery-policy.ts";
import {demoProducts,brandDirectory} from "../../src/modules/catalog/marketplace.ts";
import {catalogPhotos} from "../../src/modules/catalog/catalog-photos.ts";
import {catalogVisuals} from "../../src/modules/catalog/catalog-visuals.ts";
import {generatedVisuals} from "../../src/modules/catalog/generated-visuals.ts";
import {approvedFamilyMedia} from "../../src/modules/catalog/media-integrity.ts";
import {brandMediaFor} from "../../src/modules/catalog/brand-media.ts";
import {groupCatalogByPhoto} from "../../src/modules/catalog/media-usage.ts";
import {usableMediaSource} from "../../src/modules/catalog/failed-media-sources.ts";
import fs from "node:fs";
import {createHash} from "node:crypto";
import {approvedMedia} from "../../src/modules/catalog/approved-family-media.ts";
import {sourceConfirmedPhotos} from "../../src/modules/catalog/source-confirmed-photos.ts";
import {manufacturerPhotoSource} from "../../src/modules/catalog/manufacturer-photo-sources.ts";
import sharp from "sharp";
const families=groupCatalogByPhoto(demoProducts);
const byCategory={},products=[],local=new Map(),usage=new Map();
async function checkLocal(path){if(local.has(path))return local.get(path);let issue=null;try{const img=sharp("public"+path);const meta=await img.metadata();await img.resize(1,1,{fit:"fill"}).raw().toBuffer();if(!meta.width||!meta.height)issue="Undecodable";else if(meta.width<320||meta.height<240)issue="Low resolution";}catch{issue="Missing or invalid local file";}local.set(path,issue);return issue;}
for(const {primary:p,variants} of families){const photos=catalogPhotos(p),reviewed=approvedFamilyMedia(p);const flags=[];if(!photos.length)flags.push("missing-photo");if(!reviewed.length)flags.push("no-new-reviewed-media");const distinctViews=new Set(reviewed.map(m=>m.view)).size;if(distinctViews<3)flags.push("fewer-than-three-reviewed-views");if(photos.some(x=>x.src.startsWith("https://")))flags.push("remote-reference");if(photos.some(x=>x.kind==="category"))flags.push("representative-category-only");for(const photo of photos){const list=usage.get(photo.src)??[];list.push(p.category+":"+p.slug);usage.set(photo.src,list);if(photo.src.startsWith("/")){const issue=await checkLocal(photo.src);if(issue)flags.push(issue+":"+photo.src);}}if(!p.description.trim()||p.specifications.length<2)flags.push("incomplete-details");if(!p.referenceSource&&!p.manufacturerReference&&p.verification==="reference")flags.push("no-exact-product-source");products.push({category:p.category,slug:p.slug,name:p.name,brand:p.brand,variants:variants.map(v=>v.slug),photoCount:photos.length,reviewedCount:reviewed.length,distinctReviewedViews:distinctViews,photos:photos.map(x=>({src:x.src,kind:x.kind})),flags});const c=byCategory[p.category]??={ranges:0,products:0,noPhoto:0,noReviewed:0,threeReviewed:0,remote:0,missingDetails:0};c.ranges++;c.products+=variants.length;c.noPhoto+=Number(!photos.length);c.noReviewed+=Number(!reviewed.length);c.threeReviewed+=Number(distinctViews>=3);c.remote+=Number(flags.includes("remote-reference"));c.missingDetails+=Number(flags.includes("incomplete-details"));}
const brands=brandDirectory.map(b=>{const m=brandMediaFor(b.name==="JSW"?"JSW Neosteel":b.name);return {...b,logo:m?.logo??null,logoStatus:!m||!usableMediaSource(m.logo)?"fallback":m.logo.startsWith("/")?"local-reference":"remote-reference"};});
// Distinguish an actual product source from a generic photo citation or a retailer category page.
for(const row of products){
 const p=demoProducts.find(x=>x.category===row.category&&x.slug===row.slug);
 const generic=/^(?:local\b|brand to confirm$|mill to confirm$|dealer-listed brand$)/i.test(row.brand)||row.brand.includes(" / ");
 const source=p?.manufacturerReference||p?.referenceSource||null;
 row.sourceClassification=source?(p.manufacturerReference?"manufacturer-reference":"retailer-or-technical-reference"):generic?"supplier-specification-required":"branded-product-source-required";
 row.sourceUrl=source;
 row.mediaSourceUrls=approvedFamilyMedia(p).map(m=>m.sourceUrl);
 row.requiresExactSupplierVariant=generic;
}
for(const brand of brands){if(brand.logoStatus==="local-reference"){try{const metadata=await sharp("public"+brand.logo).metadata();if(!metadata.width||!metadata.height)throw Error("invalid logo");await sharp("public"+brand.logo).resize(1,1).raw().toBuffer();}catch{brand.logoStatus="fallback";}}}
const report={scope:"All static catalog families and variants; not merchant stock or browser verification",totals:{products:demoProducts.length,families:families.length,brands:brands.length,noPhoto:products.filter(p=>p.photoCount===0).length,missingBrandEntries:brands.filter(b=>b.logoStatus==="fallback").length,missingProductSources:products.filter(p=>p.flags.includes("no-exact-product-source")).length},byCategory,brands,sharedPhotoReferences:[...usage].filter(([,r])=>r.length>1).map(([src,ranges])=>({src,ranges})),localFileIssues:[...local].filter(([,issue])=>issue),products};
// Pin the requested improvement to the verified 177-family backlog, not a moving baseline.
const targetMissing=7;
const missing=report.totals.noPhoto;
report.coverageTarget={baselineMissingFamilies:177,requiredAdditionalFamilies:170,maximumMissingFamilies:targetMissing,currentMissingFamilies:missing,remainingToTarget:Math.max(0,missing-targetMissing),met:missing<=targetMissing};
report.backlog=products.filter(p=>p.flags.includes("missing-photo")||p.flags.includes("remote-reference")||p.flags.includes("fewer-than-three-reviewed-views")).map(p=>({category:p.category,slug:p.slug,name:p.name,brand:p.brand,photoCount:p.photoCount,reviewedCount:p.reviewedCount,flags:p.flags}));
report.totals.locallyUsablePhotoFamilies=products.filter(p=>p.photos.some(x=>x.src.startsWith("/")&&!local.get(x.src)&&x.kind!=="category")).length;
report.totals.multiViewReviewedFamilies=products.filter(p=>p.distinctReviewedViews>=3).length;
report.totals.uniqueMissingBrands=new Set(brands.filter(b=>b.logoStatus==="fallback").map(b=>b.name.trim().toLowerCase())).size;
report.totals.brandedMissingProductSources=products.filter(p=>p.sourceClassification==="branded-product-source-required").length;
report.totals.genericSupplierSpecificationRequired=products.filter(p=>p.sourceClassification==="supplier-specification-required").length;
report.totals.familiesWithNonIllustrativePhoto=products.filter(p=>p.photos.some(x=>x.kind!=="category")).length;
report.totals.illustrationOnlyFamilies=products.filter(p=>p.photos.length&&p.photos.every(x=>x.kind==="category")).length;
report.totals.localLogoEntries=brands.filter(b=>b.logoStatus==="local-reference").length;
report.totals.remoteLogoEntries=brands.filter(b=>b.logoStatus==="remote-reference").length;
report.brandWorklist=brands.filter(b=>b.logoStatus==="fallback"||b.logoStatus==="remote-reference");
report.sourceWorklist=products.filter(p=>!p.sourceUrl).map(p=>({category:p.category,slug:p.slug,brand:p.brand,name:p.name,sourceClassification:p.sourceClassification,mediaSourceUrls:p.mediaSourceUrls}));
report.lowResolutionWorklist=products.filter(p=>p.flags.some(f=>f.startsWith("Low resolution:"))).map(p=>({category:p.category,slug:p.slug,name:p.name,sourceUrl:p.sourceUrl,images:p.flags.filter(f=>f.startsWith("Low resolution:"))}));

// Validate the actual bytes and every variant, not just the first family member.
const integrityFailures=[];
const approvedPaths=new Set();
for(const media of [...approvedMedia,...sourceConfirmedPhotos]){
  if(approvedPaths.has(media.path))integrityFailures.push({path:media.path,reason:"Duplicate approved path"});
  approvedPaths.add(media.path);
  try{
    if(!/^\/images\/catalog\/approved\/[a-f0-9]{24}\.webp$/.test(media.path))throw Error("Unexpected approved asset path");
    const bytes=fs.readFileSync("public"+media.path);
    const meta=await sharp(bytes).metadata();
    await sharp(bytes).resize(1,1).raw().toBuffer();
    if(createHash("sha256").update(bytes).digest("hex")!==media.sha256||bytes.length!==media.bytes)throw Error("Manifest hash or byte count mismatch");
    if(meta.width!==media.width||meta.height!==media.height||meta.format!=="webp")throw Error("Manifest dimensions or image format mismatch");
    if(!media.credit||!media.license||!media.licenseUrl||!media.sourceUrl)throw Error("Missing source or reuse attribution");
  }catch(error){integrityFailures.push({path:media.path,reason:String(error.message??error)});}
}
const variantWorklist=[];
for(const {primary,variants} of families){
  for(const variant of variants){
    const photos=catalogPhotos(variant);
    const usable=await Promise.all(photos.map(async photo=>photo.src.startsWith("/")&&photo.kind!=="category"&&!(await checkLocal(photo.src))));
    const flags=[];
    if(!photos.length)flags.push("missing-photo");
    if(!usable.some(Boolean))flags.push("no-usable-local-photograph");
    if(photos.some(photo=>photo.src.startsWith("https://")))flags.push("remote-reference");
    if(flags.length)variantWorklist.push({category:variant.category,slug:variant.slug,family:primary.slug,name:variant.name,brand:variant.brand,flags});
  }
}
// Generated illustrations are tracked separately from verified photographs.
report.generatedVisuals={assets:generatedVisuals.length,bytes:generatedVisuals.reduce((n,m)=>n+m.bytes,0),invalid:[],missingVisualFamilies:[],familiesWithGeneratedFallback:0,byCategory:{}};
for(const m of generatedVisuals){try{const bytes=fs.readFileSync("public"+m.path);const meta=await sharp(bytes).metadata();await sharp(bytes).resize(1,1).raw().toBuffer();if(meta.format!=="webp"||meta.width!==m.width||meta.height!==m.height||m.width<280||m.height<280||bytes.length!==m.bytes||bytes.length>35000||createHash("sha256").update(bytes).digest("hex")!==m.sha256)throw Error("Generated asset integrity failure");if(!demoProducts.some(p=>p.category===m.category&&(p.familyKey??p.slug)===m.family))throw Error("Unknown generated product family");}catch(e){report.generatedVisuals.invalid.push({family:m.family,error:String(e)});}}
for(const {primary:p,variants} of families){const media=catalogVisuals(p);const c=report.generatedVisuals.byCategory[p.category]??={families:0,withGeneratedFallback:0,withoutVisual:0};c.families++;if(media.some(m=>m.kind==="generated")){c.withGeneratedFallback++;report.generatedVisuals.familiesWithGeneratedFallback++;}const missingVariants=variants.filter(v=>!catalogVisuals(v).some(m=>m.kind!=="category"||v.category==="bricks-blocks")).map(v=>v.slug);if(missingVariants.length){c.withoutVisual++;report.generatedVisuals.missingVisualFamilies.push({category:p.category,slug:p.slug,brand:p.brand,name:p.name,variants:missingVariants});}}
report.generatedVisuals.missingVisualCount=report.generatedVisuals.missingVisualFamilies.length;
// Measure actual locally available visuals for every publicly discoverable variant.
const publicFamilies=families.filter(g=>g.variants.some(isPublicConstructionProduct));
const generatedFailures=new Set(report.generatedVisuals.invalid.map(m=>m.family));
const missingPublicVariants=[];
for(const g of publicFamilies){
 for(const p of g.variants.filter(isPublicConstructionProduct)){
  let usable=false;
  for(const media of catalogVisuals(p)){
   if(!media.src.startsWith("/")||media.kind==="category")continue;
   if(media.kind==="generated"){
    if(!generatedFailures.has(p.familyKey??p.slug)){usable=true;break;}
   }else if(!await checkLocal(media.src)){usable=true;break;}
  }
  if(!usable)missingPublicVariants.push({category:p.category,slug:p.slug,family:g.primary.slug,brand:p.brand,name:p.name});
 }
}
const missingKeys=new Set(missingPublicVariants.map(p=>p.category+":"+p.family));
report.publicDiscovery={families:publicFamilies.length,hiddenAccessoryFamilies:families.length-publicFamilies.length,missingVisualFamilies:publicFamilies.filter(g=>missingKeys.has(g.primary.category+":"+g.primary.slug)).map(g=>({category:g.primary.category,slug:g.primary.slug,name:g.primary.name})),missingVisualVariants:missingPublicVariants};
report.publicDiscovery.missingVisualCount=report.publicDiscovery.missingVisualFamilies.length;
report.generatedVisuals.priorityMissing=report.generatedVisuals.missingVisualFamilies.filter(p=>p.category==="plumbing"||p.category==="hardware");
report.generatedVisuals.priorityMissingCount=report.generatedVisuals.priorityMissing.length;
report.generatedVisuals.missingVariantCount=report.generatedVisuals.missingVisualFamilies.reduce((n,p)=>n+p.variants.length,0);
integrityFailures.push(...report.generatedVisuals.invalid);
// Separate exact reviewed SKU coverage from family/reference coverage. The same
// family photograph cannot prove every size, grade, pack or brand variant.
const exactSkuWorklist=[];
const visualSourcingWorklist=[];
const categoryPriority=["cement","steel","bricks-blocks","plumbing","electrical","tiles","hardware","paint","aggregates"];
for(const product of demoProducts){
 const media=approvedFamilyMedia(product);
 const hasExact=media.some(m=>m.scope==="sku"&&m.family===product.slug)
  || (product.verification==="merchant_verified"&&product.imageVerified===true&&catalogPhotos(product).some(p=>p.kind==="sku"));
 const actual=catalogPhotos(product),visuals=catalogVisuals(product);
 const localPhoto=(await Promise.all(actual.map(async x=>x.src.startsWith("/")&&x.kind!=="category"&&!(await checkLocal(x.src))))).some(Boolean);
 const generated=visuals.some(x=>x.kind==="generated");
 if(!hasExact||!localPhoto)visualSourcingWorklist.push({category:product.category,slug:product.slug,family:product.familyKey??product.slug,name:product.name,brand:product.brand,route:"/materials/"+product.category+"/"+product.slug,priority:categoryPriority.indexOf(product.category)<7?"P0":"P1",hiddenAccessory:!isPublicConstructionProduct(product),status:hasExact&&localPhoto?"exact-local":localPhoto?"local-reference":generated?"illustration-only":actual.length?"remote-or-category-reference":"missing",officialProductSource:manufacturerPhotoSource(product.category,product.slug)??product.manufacturerReference??null,otherSource:product.referenceSource??null,exactSku:hasExact,localPhoto,generated,nextAction:localPhoto?"verify exact SKU and rights":generated?"source real photograph; illustration is not proof":product.brand.match(/^(?:local\b|brand to confirm$|dealer-listed brand$|mill to confirm$)/i)?"source licensed photo or commission generic illustration":"request manufacturer/dealer photo and permission"}); 
 if(!hasExact)exactSkuWorklist.push({category:product.category,slug:product.slug,brand:product.brand,name:product.name,reason:catalogPhotos(product).length?"reference-photo-only":"missing-photo",source:product.manufacturerReference??product.referenceSource??null});
}
report.exactSkuPhotography={totalVariants:demoProducts.length,verifiedVariants:demoProducts.length-exactSkuWorklist.length,remainingVariants:exactSkuWorklist.length,worklist:exactSkuWorklist,scope:"Static catalog only; verified exact SKU identity is distinct from family imagery."};
report.visualSourcingWorklist=visualSourcingWorklist.sort((a,b)=>categoryPriority.indexOf(a.category)-categoryPriority.indexOf(b.category)||a.slug.localeCompare(b.slug));
report.sourceConfirmedReferences={assets:sourceConfirmedPhotos.length,families:new Set(sourceConfirmedPhotos.map(x=>x.category+":"+x.family)).size,scope:"Licensed source-page-confirmed family references; independent visual review pending, not exact SKU photographs."};
report.variantWorklist=variantWorklist;
report.integrityFailures=integrityFailures;
report.totals.variantsWithoutConfiguredPhoto=variantWorklist.filter(v=>v.flags.includes("missing-photo")).length;
report.totals.variantsWithoutUsableLocalPhoto=variantWorklist.filter(v=>v.flags.includes("no-usable-local-photograph")).length;
report.localFileIssues=[...local].filter(([,issue])=>issue);
const hardFailures=report.localFileIssues.filter(([,issue])=>issue!=="Low resolution");
const regressionFailures=[];
if(report.totals.noPhoto>170)regressionFailures.push("Missing configured families exceed 170 baseline");
if(report.totals.missingBrandEntries>26)regressionFailures.push("Missing logo entries exceed 26 baseline");
if(report.localFileIssues.filter(([,issue])=>issue==="Low resolution").length>2)regressionFailures.push("Low resolution files exceed 2 baseline");
report.releaseReadiness={regressionFailures,hardFailures,integrityFailures,strictFailures:[
  ...(!report.coverageTarget.met?["Required additional family photos not complete"]:[]),
  ...(report.publicDiscovery.missingVisualCount?["Public products without usable local visual remain"]:[]),
  ...(report.generatedVisuals.priorityMissingCount?["Hardware and plumbing product visual coverage incomplete"]:[]),
  ...(report.generatedVisuals.missingVisualCount?["Catalog product visual coverage incomplete"]:[]),
  ...(report.totals.missingBrandEntries?["Missing brand logos remain"]:[]),
  ...(report.totals.remoteLogoEntries?["Remote logo dependencies remain"]:[]),
  ...(report.localFileIssues.some(([,issue])=>issue==="Low resolution")?["Low resolution photos remain"]:[])
]};
report.releaseReadiness.ready=!report.releaseReadiness.strictFailures.length&&!regressionFailures.length&&!hardFailures.length&&!integrityFailures.length;

fs.mkdirSync("catalog-audit",{recursive:true});fs.writeFileSync("catalog-audit/report.json",JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({sourceConfirmedReferences:report.sourceConfirmedReferences,visualSourcingRows:report.visualSourcingWorklist.length,totals:report.totals,coverageTarget:report.coverageTarget,byCategory,brandsMissing:brands.filter(b=>b.logoStatus==="fallback").map(b=>b.name),localFileIssues:report.localFileIssues,publicDiscovery:{families:report.publicDiscovery.families,hiddenAccessoryFamilies:report.publicDiscovery.hiddenAccessoryFamilies,missingVisualCount:report.publicDiscovery.missingVisualCount,missingVariants:report.publicDiscovery.missingVisualVariants.length},generatedVisuals:{assets:report.generatedVisuals.assets,bytes:report.generatedVisuals.bytes,missingVisualCount:report.generatedVisuals.missingVisualCount,priorityMissingCount:report.generatedVisuals.priorityMissingCount,missingVariantCount:report.generatedVisuals.missingVariantCount,byCategory:report.generatedVisuals.byCategory}},null,2));

if(!report.coverageTarget.met)console.warn("Coverage release target NOT MET: "+report.coverageTarget.remainingToTarget+" additional families still required. Audit completion alone is not a release approval.");

// PRs reject new breakage; a strict release audit also rejects the existing backlog.
if(hardFailures.length||integrityFailures.length||regressionFailures.length||(process.argv.includes("--strict")&&!report.releaseReadiness.ready)){
 console.error("Catalog gate failed",JSON.stringify(report.releaseReadiness,null,2));
 process.exitCode=1;
}
