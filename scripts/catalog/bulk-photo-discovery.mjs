import fs from "node:fs/promises";
import {createHash} from "node:crypto";
import sharp from "sharp";
import {demoProducts} from "../../src/modules/catalog/marketplace.ts";
import {catalogPhotos} from "../../src/modules/catalog/catalog-photos.ts";
import {catalogVisuals} from "../../src/modules/catalog/catalog-visuals.ts";
import {isPublicConstructionProduct} from "../../src/modules/catalog/discovery-policy.ts";
import {fittingReference} from "../../src/modules/catalog/fitting-references.ts";
import {hardwareReference} from "../../src/modules/catalog/hardware-references.ts";
import {paintReference} from "../../src/modules/catalog/paint-references.ts";
import {tileReferenceMedia} from "../../src/modules/catalog/tile-references.ts";
import {manufacturerPhotoSource} from "../../src/modules/catalog/manufacturer-photo-sources.ts";
import {usableMediaSource} from "../../src/modules/catalog/failed-media-sources.ts";
import {priority,familyKey,query,brief,commonsUrl,license,text,csv} from "./bulk-photo-policy.mjs";
const root="catalog-bulk-review",agent="NeervaBuildCatalogReview/1.0 (https://github.com/Neurolink-X/neerva-build)";
await fs.mkdir(root+"/images",{recursive:true});
const groups=new Map(),cache=new Map();
for(const p of demoProducts){const k=familyKey(p);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(p);}
async function localPhoto(src){if(!src.startsWith("/images/catalog/"))return false;if(cache.has(src))return cache.get(src);let ok=false;try{const m=await sharp("public"+src).metadata();ok=m.width>=320&&m.height>=240;}catch{}cache.set(src,ok);return ok;}
const rows=[];
for(const [id,variants] of groups){
 const gaps=[];for(const p of variants){let local=false;for(const m of catalogPhotos(p)){if(m.kind!=="category"&&await localPhoto(m.src)){local=true;break;}}if(!local)gaps.push(p);}
 if(!gaps.length)continue;
 const p=gaps[0],visible=gaps.some(isPublicConstructionProduct),orderable=gaps.some(v=>isPublicConstructionProduct(v)&&!v.quoteOnly),sources=new Map();
 for(const v of gaps){const f=fittingReference(v.slug),h=hardwareReference(v.slug),a=paintReference(v.slug),t=tileReferenceMedia(v.slug);
  for(const [url,kind] of [[manufacturerPhotoSource(v.category,v.slug),"manufacturer"],[v.manufacturerReference,"manufacturer"],[f?.imageSource,"manufacturer"],[v.referenceSource,"listing"],[h?.source,"listing"],[a?.source,"product-reference"],[v.referenceImage,"image"],[f?.image,"image"],[h?.image,"image"],[a?.image,"image"],[t?.swatch,"image"],[t?.room,"image"]]){
   if(typeof url!=="string")continue;try{const u=new URL(url);if(u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&!u.hash)sources.set(u.href,{url:u.href,kind,status:usableMediaSource(url)?"review-required":"failed-source"});}catch{}
  }
 }
 rows.push({id,category:p.category,family:p.familyKey??p.slug,name:p.name,brand:p.brand,variants:gaps.map(v=>v.slug),priority:orderable&&priority.indexOf(p.category)<7?"P0":visible?"P1":"P2",visible,orderable,missingConfigured:gaps.some(v=>!catalogPhotos(v).length),existingIllustration:gaps.every(v=>catalogVisuals(v).some(m=>m.kind==="generated")),query:query(p),sourceHints:[...sources.values()],generationBrief:brief(p),candidates:[],errors:[]});
}
rows.sort((a,b)=>a.priority.localeCompare(b.priority)||priority.indexOf(a.category)-priority.indexOf(b.category)||a.id.localeCompare(b.id));
const delay=ms=>new Promise(r=>setTimeout(r,ms)),deadline=Date.now()+9*60*1000;
async function get(url,limit,timeout=15000){
 for(let i=0;i<2;i++){
  const r=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(timeout),headers:{"User-Agent":agent}});
  if(!r.ok){await r.body?.cancel();if(i===0&&[429,503].includes(r.status)){await delay(1800);continue;}throw Error("HTTP "+r.status);}
  const reader=r.body?.getReader();if(!reader)throw Error("Empty response");const chunks=[];let size=0;
  while(true){const v=await reader.read();if(v.done)break;size+=v.value.length;if(size>limit){await reader.cancel();throw Error("Response size limit");}chunks.push(Buffer.from(v.value));}return Buffer.concat(chunks);
 }
}
const used=new Map(),downloads=new Map();
async function stage(url){
 if(downloads.has(url))return downloads.get(url);
 const job=(async()=>{const bytes=await get(url,8*1024*1024);const {data,info}=await sharp(bytes,{limitInputPixels:30000000}).rotate().resize({width:900,height:900,fit:"inside",withoutEnlargement:true}).webp({quality:75}).toBuffer({resolveWithObject:true});if(info.width<320||info.height<240||data.length>350000)throw Error("Image dimensions or size");
 const hash=createHash("sha256").update(data).digest("hex"),file="images/"+hash.slice(0,24)+".webp";await fs.writeFile(root+"/"+file,data);return {file,sha256:hash,width:info.width,height:info.height,bytes:data.length};})();downloads.set(url,job);return job;
}
async function discover(row){
 if(Date.now()>deadline){row.errors.push("Budget exhausted; not searched");return;}
 const url=new URL("https://commons.wikimedia.org/w/api.php");url.search=new URLSearchParams({action:"query",format:"json",formatversion:"2",generator:"search",gsrnamespace:"6",gsrsearch:row.query+" filetype:bitmap",gsrlimit:"8",prop:"imageinfo",iiprop:"url|size|sha1|extmetadata|mime",iiurlwidth:"900",iiextmetadatafilter:"LicenseShortName|LicenseUrl|Artist|ImageDescription|Restrictions"});
 try{const r=JSON.parse((await get(url.href,2*1024*1024)).toString());if(r.error)throw Error(text(r.error.code));for(const p of (r.query?.pages??[]).sort((a,b)=>(a.index??99)-(b.index??99))){
  if(row.candidates.length>=2||Date.now()>deadline)break;
  const m=p.imageinfo?.[0],lic=license(m?.extmetadata),credit=text(m?.extmetadata?.Artist?.value),source=commonsUrl(m?.descriptionurl,true),image=commonsUrl(m?.thumburl??m?.url);
  if(!m||!["image/jpeg","image/png","image/webp"].includes(m.mime)||!lic||!credit||!source||!image||text(m.extmetadata?.Restrictions?.value)||!m.sha1)continue;
  try{const asset=await stage(image);if(used.has(asset.sha256)&&used.get(asset.sha256)!==row.id)continue;if(row.candidates.some(x=>x.sha256===asset.sha256))continue;used.set(asset.sha256,row.id);row.candidates.push({...asset,source,imageUrl:image,originalSha1:m.sha1,title:text(p.title),credit,license:lic.name,licenseUrl:lic.url,status:"review-required",scope:"family-reference-only"});}catch(e){row.errors.push(text(e.message,120));}
 }}catch(e){row.errors.push(text(e.message,140));}
}
if(!process.argv.includes("--plan-only")){let i=0;await Promise.all(Array.from({length:3},async()=>{while(i<rows.length){await discover(rows[i++]);await delay(200);}}));}
const byCategory={};for(const r of rows){const c=byCategory[r.category]??={families:0,variants:0,missingConfigured:0,withCandidates:0,sourceHints:0};c.families++;c.variants+=r.variants.length;c.missingConfigured+=Number(r.missingConfigured);c.withCandidates+=Number(r.candidates.length>0);c.sourceHints+=Number(r.sourceHints.length>0);}
const summary={families:rows.length,variants:rows.reduce((n,r)=>n+r.variants.length,0),missingConfigured:rows.filter(r=>r.missingConfigured).length,withCandidates:rows.filter(r=>r.candidates.length).length,downloadedCandidates:used.size,withSourceHints:rows.filter(r=>r.sourceHints.length).length,illustrationBriefs:rows.filter(r=>r.generationBrief).length,byCategory};
await fs.writeFile(root+"/report.json",JSON.stringify({scope:"Unpublished sourcing candidates only, not exact SKU or reuse approval",...summary,rows},null,2)+"\n");
await fs.writeFile(root+"/worklist.csv",[["priority","category","family","brand","variants","sources","candidates","status"],...rows.map(r=>[r.priority,r.category,r.family,r.brand,r.variants.join(";"),r.sourceHints.map(x=>x.url).join(";"),r.candidates.length,r.candidates.length?"review required":"source required"])].map(r=>r.map(csv).join(",")).join("\n"));
await fs.writeFile(root+"/generation-briefs.json",JSON.stringify(rows.filter(r=>r.generationBrief&&!r.candidates.length).map(r=>({category:r.category,family:r.family,prompt:r.generationBrief})),null,2));
const esc=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
await fs.writeFile(root+"/review.html",'<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Neerva photo candidate review</title><style>body{font:15px system-ui;margin:20px}article{border:1px solid #ddd;padding:12px;margin:12px 0}figure{display:inline-block;max-width:260px;margin:8px;vertical-align:top}img{width:250px;height:180px;object-fit:contain}</style><h1>Unpublished catalog candidate review</h1><p>Confirm exact material, image identity and reuse rights; never publish a search match automatically.</p>'+rows.map(r=>'<article><strong>'+esc(r.priority+" · "+r.category+" · "+r.name)+'</strong><p>'+esc(r.brand+" · "+r.variants.join(", "))+'</p>'+r.candidates.map(c=>'<figure><img loading="lazy" src="'+esc(c.file)+'" alt="'+esc(c.title)+'"><figcaption>'+esc(c.title+" · "+c.credit+" · "+c.license)+' <a href="'+esc(c.source)+'">Source</a></figcaption></figure>').join("")+'</article>').join(""));
console.log(JSON.stringify(summary,null,2));
