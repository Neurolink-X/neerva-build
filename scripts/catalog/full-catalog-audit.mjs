import {demoProducts,brandDirectory} from "../../src/modules/catalog/marketplace.ts";
import {catalogPhotos} from "../../src/modules/catalog/catalog-photos.ts";
import {approvedFamilyMedia} from "../../src/modules/catalog/media-integrity.ts";
import {brandMediaFor} from "../../src/modules/catalog/brand-media.ts";
import {groupCatalogByPhoto} from "../../src/modules/catalog/media-usage.ts";
import {usableMediaSource} from "../../src/modules/catalog/failed-media-sources.ts";
import fs from "node:fs";
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

fs.mkdirSync("catalog-audit",{recursive:true});fs.writeFileSync("catalog-audit/report.json",JSON.stringify(report,null,2)+"\n");console.log(JSON.stringify({totals:report.totals,coverageTarget:report.coverageTarget,byCategory,brandsMissing:brands.filter(b=>b.logoStatus==="fallback").map(b=>b.name),localFileIssues:report.localFileIssues},null,2));

if(!report.coverageTarget.met)console.warn("Coverage release target NOT MET: "+report.coverageTarget.remainingToTarget+" additional families still required. Audit completion alone is not a release approval.");
