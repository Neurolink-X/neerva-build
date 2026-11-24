// Explicit operator task: run only for assets with permission for local republication.
// No downloads during a production build. Review the report and commit the manifest + files together.
import {createHash} from "node:crypto";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import {createRequire} from "node:module";
import {brandMedia} from "../../src/modules/catalog/brand-media.ts";
import {rangeMedia} from "../../src/modules/catalog/brand-pages.ts";
import {localBrandAssets} from "../../src/modules/catalog/local-brand-assets.ts";
const args=process.argv.slice(2);
const approved=new Set(args.filter(x=>x.startsWith("https://")));
if(!approved.size){console.error("Pass the exact reviewed HTTPS asset URLs to import; no automatic blanket copying.");process.exit(1);}
const require=createRequire(import.meta.url);
const sharp=require("sharp");
const registry=new Set([...Object.values(brandMedia).map(x=>x.logo),...Object.values(rangeMedia).map(x=>x.image)]);
const out="public/images/catalog/brand-local";
await mkdir(out,{recursive:true});
const next={...localBrandAssets};
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
  await writeFile(out+"/"+name,rendered);next[url]="/images/catalog/brand-local/"+name;
  console.log("IMPORTED",url,next[url],rendered.length);
 }catch(error){console.error("SKIPPED",url,error instanceof Error?error.message:String(error));process.exitCode=1;}
}
for(const path of Object.values(next))await readFile("public"+path);
await writeFile("src/modules/catalog/local-brand-assets.ts","// Generated from approved, successfully imported assets.\nexport const localBrandAssets:Record<string,string>="+JSON.stringify(next,null,2)+";\n");
