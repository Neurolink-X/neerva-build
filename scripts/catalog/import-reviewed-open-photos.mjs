// Only these exact visually reviewed originals may be imported. Never follows redirects.
import fs from "node:fs/promises";
import {createHash} from "node:crypto";
import sharp from "sharp";
const reviewed=JSON.parse(await fs.readFile("scripts/catalog/reviewed-open-photo-sources.json","utf8"));
const manifest="src/modules/catalog/approved-family-media.ts";
const text=await fs.readFile(manifest,"utf8");
const prefix=text.slice(0,text.indexOf("export const approvedMedia:"));
if(!prefix.includes("export type ApprovedMedia"))throw Error("Manifest format invalid");
const existing=JSON.parse(text.slice(text.indexOf("[]=")+3).trim().replace(/;$/,""));const rows=[];
for(const r of reviewed){
 const u=new URL(r.url);
 if(u.protocol!=="https:"||u.hostname!=="upload.wikimedia.org"||!u.pathname.startsWith("/wikipedia/commons/"))throw Error("Unexpected source");
 let response;
 for(let attempt=0;attempt<2;attempt++){
  try{response=await fetch(r.url,{redirect:"error",signal:AbortSignal.timeout(20000),headers:{"User-Agent":"NeervaBuildCatalogMedia/1.0 (https://github.com/Neurolink-X/neerva-build)"} });if(response.ok)break;}catch(e){console.warn(String(e));}
  if(attempt===0)await new Promise(resolve=>setTimeout(resolve,1500));
 }
 if(!response?.ok){console.warn("Download unavailable",r.family,response?.status);continue;}
 const reader=response.body?.getReader();if(!reader)throw Error("Missing body");
 const chunks=[];let size=0;
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>8000000){await reader.cancel();throw Error("Source exceeds 8 MB");}chunks.push(Buffer.from(part.value));}
 const original=Buffer.concat(chunks);
 if(createHash("sha1").update(original).digest("hex")!==r.sha1)throw Error("Original checksum mismatch: "+r.family);
 const {data,info}=await sharp(original,{limitInputPixels:25000000}).rotate().resize({width:1200,height:1200,fit:"inside",withoutEnlargement:true}).webp({quality:78}).toBuffer({resolveWithObject:true});
 if(info.width<320||info.height<240||data.length>350000)throw Error("Image dimensions or size invalid: "+r.family);
 const sha256=createHash("sha256").update(data).digest("hex");if(rows.some(m=>m.sha256===sha256))throw Error("Duplicate image");
 const path="/images/catalog/approved/"+sha256.slice(0,24)+".webp";
 const {url,sha1,...metadata}=r;
 rows.push({...metadata,scope:"family",sourceType:"curated",verified:true,primary:r.primary??true,path,width:info.width,height:info.height,bytes:data.length,sha256,sortOrder:r.sortOrder??0});
 await fs.mkdir("public/images/catalog/approved",{recursive:true});
 await fs.writeFile("public"+path,data);
 console.log("Imported",r.family,info.width,info.height,data.length,sha256);
}
if(!rows.length)throw Error("No verified originals could be downloaded; no public manifest changed");
if(rows.length!==reviewed.length)throw Error("Incomplete batch; no public manifest changed");
const merged=[...existing];for(const row of rows){const index=merged.findIndex(m=>m.category===row.category&&m.family===row.family&&m.scope===row.scope&&m.view===row.view);if(index>=0)merged[index]=row;else merged.push(row);}if(new Set(merged.map(m=>m.sha256)).size!==merged.length)throw Error("Duplicate approved image");const primaryCounts=new Map();for(const m of merged){const key=[m.category,m.scope,m.family].join(":");primaryCounts.set(key,(primaryCounts.get(key)??0)+Number(m.primary));}if([...primaryCounts.values()].some(n=>n!==1))throw Error("Exactly one primary per family required");await fs.writeFile(manifest,prefix+"export const approvedMedia:readonly ApprovedMedia[]="+JSON.stringify(merged,null,2)+";\n");
console.log("Verified imported photos:",rows.length);
