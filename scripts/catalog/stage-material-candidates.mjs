import fs from "node:fs/promises";
import {createHash} from "node:crypto";
import sharp from "sharp";
const candidates=JSON.parse(await fs.readFile("scripts/catalog/material-photo-review-candidates.json","utf8"));
const root="assets/catalog/material-review";
await fs.mkdir(root,{recursive:true});const rows=[];
let previous=[];try{previous=JSON.parse(await fs.readFile(root+"/manifest.json","utf8")).rows??[];}catch{}

for(const item of candidates){try{
 const old=previous.find(r=>r.key===item.key&&r.filename===item.filename&&r.status==="visual-review-required"&&r.file&&r.sha256);
 if(old){try{const b=await fs.readFile(root+"/"+old.file);if(createHash("sha256").update(b).digest("hex")===old.sha256){rows.push({...old,...item});continue;}}catch{}}

 const hash=createHash("md5").update(item.filename).digest("hex");
 const expected="https://upload.wikimedia.org/wikipedia/commons/"+hash[0]+"/"+hash.slice(0,2)+"/"+encodeURIComponent(item.filename);
 if(item.url&&decodeURI(expected)!==decodeURI(item.url))throw Error("Unexpected Wikimedia source");
 let r;for(let attempt=0;attempt<2;attempt++){r=await fetch(expected,{redirect:"error",signal:AbortSignal.timeout(20000),headers:{"User-Agent":"NeervaBuildCatalogMedia/1.0 (https://github.com/Neurolink-X/neerva-build)"}});if(r.ok||![429,503].includes(r.status))break;await r.body?.cancel();const delay=Math.min(10000,Math.max(1500,Number(r.headers.get("Retry-After")||0)*1000||1500));await new Promise(resolve=>setTimeout(resolve,delay));}
 if(!r?.ok||!r.body)throw Error("HTTP "+r.status);
 const reader=r.body.getReader(),chunks=[];let size=0;while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>8000000){await reader.cancel();throw Error("Source too large");}chunks.push(Buffer.from(p.value));}
 const source=Buffer.concat(chunks);
 let encoded;
 for(const edge of [1200,1000,800,640]){for(const quality of [78,68,58]){encoded=await sharp(source,{limitInputPixels:30000000,density:96}).rotate().resize({width:edge,height:edge,fit:"inside",withoutEnlargement:true}).webp({quality}).toBuffer({resolveWithObject:true});if(encoded.data.length<=350000)break;}if(encoded.data.length<=350000)break;}
 const {data,info}=encoded;
 if(info.width<100||info.height<40||data.length>350000)throw Error("Invalid image dimensions or size");
 const sha256=createHash("sha256").update(data).digest("hex");const file=sha256.slice(0,24)+".webp";
 await fs.writeFile(root+"/"+file,data);rows.push({...item,status:"visual-review-required",file,width:info.width,height:info.height,bytes:data.length,originalSha256:createHash("sha256").update(source).digest("hex"),sha256});
 }catch(err){rows.push({...item,status:"failed",reason:String(err)});}
}
await fs.writeFile(root+"/manifest.json",JSON.stringify({publication:"Not approved. Do not serve or map these files publicly.",rows},null,2)+"\n");
console.log(rows.map(r=>({key:r.key,status:r.status,bytes:r.bytes,reason:r.reason})));
