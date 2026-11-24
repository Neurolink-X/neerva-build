// Explicit operator task: run only for assets with permission for local republication.
// No downloads during a production build. Review the report and commit the manifest + files together.
import {createHash} from "node:crypto";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {fittingReferences} from "../../src/modules/catalog/fitting-references.ts";
import {hardwareReferences} from "../../src/modules/catalog/hardware-references.ts";
import {brandMedia} from "../../src/modules/catalog/brand-media.ts";
import {rangeMedia} from "../../src/modules/catalog/brand-pages.ts";
import {localBrandAssets} from "../../src/modules/catalog/local-brand-assets.ts";
const args=process.argv.slice(2);
const review=args.includes("--review");
const registry=new Set([...Object.values(brandMedia).map(x=>x.logo),...Object.values(rangeMedia).map(x=>x.image),...hardwareReferences.flatMap(x=>x.image?[x.image]:[]),...fittingReferences.flatMap(x=>x.image?.startsWith("https://")?[x.image]:[])]);
const approved=new Set(review?[...registry].filter(url=>url.startsWith("https://")):args.filter(x=>x.startsWith("https://")));
if(!approved.size){console.error("Pass the exact reviewed HTTPS asset URLs to import; no automatic blanket copying.");process.exit(1);}
const require=createRequire(import.meta.url);
const sharp=require("sharp");
const out=review?"brand-media-review/images":"public/images/catalog/brand-local";
await mkdir(out,{recursive:true});
const next={...localBrandAssets};
const report=[];
for(const url of approved){
 try{
  if(!registry.has(url))throw Error("Not a registered source");
  const response=await fetch(url,{redirect:"error",signal:AbortSignal.timeout(12000)});
  if(!response.ok)throw Error("HTTP "+response.status);
  const mime=(response.headers.get("content-type")??"").split(";")[0];
  if(!["image/jpeg","image/png","image/webp"].includes(mime))throw Error("Unsupported MIME "+mime);
  const reader=response.body?.getReader();if(!reader)throw Error("Empty response");
  const chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>3*1024*1024){await reader.cancel();throw Error("Image over 3 MB");}chunks.push(value);}
  const bytes=Buffer.concat(chunks);
  const decoder=sharp(bytes,{limitInputPixels:24_000_000,failOn:"error"});
  const meta=await decoder.metadata();if(!["jpeg","png","webp"].includes(meta.format??""))throw Error("Unapproved image format");
  const rendered=await decoder.resize({width:900,height:900,fit:"inside",withoutEnlargement:true}).webp({quality:82}).toBuffer();
  if(rendered.length>350*1024)throw Error("Optimized image over 350 KB");
  const name=createHash("sha256").update(rendered).digest("hex").slice(0,24)+".webp";
  await writeFile(out+"/"+name,rendered);if(!review)next[url]="/images/catalog/brand-local/"+name;
  report.push({url,status:"decoded",file:name,bytes:rendered.length,width:meta.width,height:meta.height});
  console.log("IMPORTED",url,next[url],rendered.length);
 }catch(error){const reason=error instanceof Error?error.message:String(error);report.push({url,status:"skipped",reason});console.error("SKIPPED",url,reason);if(!review)process.exitCode=1;}
}
if(review){await writeFile("brand-media-review/report.json",JSON.stringify({purpose:"Candidate inspection only; no publication permission or brand identity inferred from successful decoding",attempted:approved.size,decoded:report.filter(x=>x.status==="decoded").length,results:report},null,2)+"\n");}else{
for(const path of Object.values(next))await readFile("public"+path);
await writeFile("src/modules/catalog/local-brand-assets.ts","// Generated from approved, successfully imported assets.\nexport const localBrandAssets:Record<string,string>="+JSON.stringify(next,null,2)+";\n");
}
