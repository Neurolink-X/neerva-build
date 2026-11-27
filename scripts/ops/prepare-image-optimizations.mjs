/**
 * Offline, opt-in compression candidates. Uses Sharp already locked by Next.js.
 * Never overwrites a source, changes a reviewed hash, or publishes an unreviewed SKU.
 * Run: node scripts/ops/prepare-image-optimizations.mjs
 */
import {readFile,writeFile,stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,basename,extname} from "node:path";
import {mkdtemp} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const sharp=require("sharp");
const out=await mkdtemp(join(tmpdir(),"neerva-image-review-"));
const tracked=execFileSync("git",["ls-files","-z","public/images"],{encoding:"utf8"}).split("\0").filter(Boolean);
const report=[];
for(const file of tracked){
 if(!/\.(?:jpg|jpeg|png|webp|avif)$/i.test(file))continue;
 const size=(await stat(file)).size;
 if(size<=120000)continue;
 // Immutable SKU and paint-mask images require new content hashes and review.
 const protectedAsset=!file.startsWith("public/images/catalog/editorial/");
 if(protectedAsset){report.push({file,bytes:size,status:"review-manifest-or-mask-required"});continue}
 try{
  const raw=await readFile(file),meta=await sharp(raw,{limitInputPixels:16_000_000}).metadata();
  if(!meta.width||!meta.height||meta.pages>1){report.push({file,bytes:size,status:"unsupported-or-animated"});continue}
  const candidate=await sharp(raw,{limitInputPixels:16_000_000}).rotate().resize({width:1200,height:1200,fit:"inside",withoutEnlargement:true}).webp({quality:85,effort:5}).toBuffer();
  if(candidate.length>=size*.9){report.push({file,bytes:size,status:"insufficient-saving"});continue}
  const hash=createHash("sha256").update(candidate).digest("hex");
  const name=basename(file,extname(file))+"-"+hash.slice(0,12)+".webp";
  await writeFile(join(out,name),candidate,{flag:"wx"});
  report.push({file,bytes:size,candidate:name,candidateBytes:candidate.length,saved:size-candidate.length,sha256:hash,status:"needs-visual-review"});
 }catch(error){report.push({file,bytes:size,status:"error",message:String(error)})}
}
await writeFile(join(out,"report.json"),JSON.stringify(report,null,2));
console.log(JSON.stringify({out,reviewOnly:true,candidates:report.filter(r=>r.candidate).length,potentialSavings:report.reduce((n,r)=>n+(r.saved??0),0),report},null,2));
