import fs from "node:fs/promises";
import {createHash} from "node:crypto";
import sharp from "sharp";
const candidates=JSON.parse(await fs.readFile("scripts/catalog/material-photo-review-candidates.json","utf8"));
const root="assets/catalog/material-review";
await fs.mkdir(root,{recursive:true});const rows=[];
for(const item of candidates){try{
 const hash=createHash("md5").update(item.filename).digest("hex");
 const expected="https://upload.wikimedia.org/wikipedia/commons/"+hash[0]+"/"+hash.slice(0,2)+"/"+encodeURIComponent(item.filename);
 if(decodeURI(expected)!==decodeURI(item.url))throw Error("Unexpected Wikimedia source");
 const r=await fetch(expected,{redirect:"error",signal:AbortSignal.timeout(20000),headers:{"User-Agent":"NeervaBuildCatalogMedia/1.0 (https://github.com/Neurolink-X/neerva-build)"}});
 if(!r.ok||!r.body)throw Error("HTTP "+r.status);
 const reader=r.body.getReader(),chunks=[];let size=0;while(true){const p=await reader.read();if(p.done)break;size+=p.value.length;if(size>8000000){await reader.cancel();throw Error("Source too large");}chunks.push(Buffer.from(p.value));}
 const source=Buffer.concat(chunks);const {data,info}=await sharp(source,{limitInputPixels:30000000,density:96}).rotate().resize({width:1200,height:1200,fit:"inside",withoutEnlargement:true}).webp({quality:78}).toBuffer({resolveWithObject:true});
 if(info.width<100||info.height<40||data.length>350000)throw Error("Invalid image dimensions or size");
 const sha256=createHash("sha256").update(data).digest("hex");const file=sha256.slice(0,24)+".webp";
 await fs.writeFile(root+"/"+file,data);rows.push({...item,status:"visual-review-required",file,width:info.width,height:info.height,bytes:data.length,originalSha256:createHash("sha256").update(source).digest("hex"),sha256});
 }catch(err){rows.push({...item,status:"failed",reason:String(err)});}
}
await fs.writeFile(root+"/manifest.json",JSON.stringify({publication:"Not approved. Do not serve or map these files publicly.",rows},null,2)+"\n");
console.log(rows.map(r=>({key:r.key,status:r.status,bytes:r.bytes,reason:r.reason})));
