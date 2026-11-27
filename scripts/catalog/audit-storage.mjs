import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
const root="assets/catalog/material-review";
const manifest=JSON.parse(fs.readFileSync(root+"/manifest.json","utf8"));
const digest=bytes=>createHash("sha256").update(bytes).digest("hex");
const retained=new Set();
let sharedCount=0,sharedBytes=0,reviewBytes=0;
for(const row of manifest.rows){
 if(!row.file){assert.equal(row.status,"failed",row.key);continue;}
 assert.match(row.file,/^[a-f0-9]{24}\.webp$/);
 assert.match(row.sha256,/^[a-f0-9]{64}$/);
 assert.equal(row.file.slice(0,24),row.sha256.slice(0,24));
 if(row.publishedPath){
  assert.match(row.publishedPath,/^\/images\/catalog\/(?:approved\/[a-f0-9]{24}|reference\/[a-z0-9-]+)\.webp$/);
  assert.equal(row.storage,"shared-public-copy",row.key);
  assert.ok(!fs.existsSync(path.join(root,row.file)),"Duplicate review asset "+row.file);
  sharedCount++;sharedBytes+=row.bytes;
 }else{retained.add(row.file);reviewBytes+=row.bytes;}
 const bytes=fs.readFileSync(row.publishedPath?"public"+row.publishedPath:path.join(root,row.file));
 assert.equal(bytes.length,row.bytes,row.key);
 assert.equal(digest(bytes),row.sha256,row.key);
}
for(const file of fs.readdirSync(root).filter(f=>f.endsWith(".webp")))assert.ok(retained.has(file),"Unreferenced review asset "+file);
console.log(JSON.stringify({sharedCount,sharedBytes,reviewBytes,retainedFiles:retained.size},null,2));

// Reviewable budgets; do not delete legitimate content merely to pass a budget.
const tracked=execFileSync("git",["ls-files","-z"],{encoding:"utf8"}).split("\0").filter(Boolean);
const budgets={tree:16*1024*1024,publicImages:10*1024*1024,reviewAssets:4*1024*1024,singleImage:512*1024};
const usage={tree:0,publicImages:0,reviewAssets:0};
const publicHashes=new Map();
for(const file of tracked){
 const stat=fs.lstatSync(file);if(!stat.isFile())continue;
 usage.tree+=stat.size;
 if(file.startsWith("assets/catalog/"))usage.reviewAssets+=stat.size;
 if(file.startsWith("public/images/")){
  usage.publicImages+=stat.size;
  assert.ok(stat.size<=budgets.singleImage,"Image exceeds storage budget: "+file);
  const hash=digest(fs.readFileSync(file));if(!publicHashes.has(hash))publicHashes.set(hash,file);
 }
}
for(const file of retained){const hash=digest(fs.readFileSync(path.join(root,file)));assert.ok(!publicHashes.has(hash),"Review asset duplicates a public file: "+file+" and "+publicHashes.get(hash));}
for(const key of Object.keys(usage))assert.ok(usage[key]<=budgets[key],key+" exceeds documented storage budget: "+usage[key]);
console.log(JSON.stringify({usage,budgets},null,2));

// Platform-wide no-growth limits for large tracked files. Existing exceptions may
// shrink, but cannot grow; deliberately review any new exception. Tests and lockfiles
// are reported as source storage, not confused with browser JavaScript.
const largeFileBaseline={
  "assets/catalog/material-review/05f6ce0da930884ab3b58eaf.webp": 138650,
  "package-lock.json": 245815,
  "public/images/catalog/approved/03b503783fe52f8e5345acf9.webp": 290910,
  "public/images/catalog/approved/0694bcf1d5a0cb4b2552a9f3.webp": 172338,
  "public/images/catalog/approved/2128b221f8e7c267c59dad00.webp": 128090,
  "public/images/catalog/approved/741c006561e80d09aeef4508.webp": 227104,
  "public/images/catalog/approved/7e936a2d7891eb62b6489fc9.webp": 137502,
  "public/images/catalog/approved/a979f7287e70ae70cffecae6.webp": 315866,
  "public/images/catalog/approved/dcfd048c44fdaf7bbbf6232c.webp": 194466,
  "public/images/catalog/approved/ef606054a5a47c548987cbb2.webp": 192336,
  "public/images/catalog/editorial/blocks-stack.jpg": 193324,
  "public/images/catalog/editorial/bricks-red.jpg": 361788,
  "public/images/catalog/editorial/pipe-stack.jpg": 159515,
  "public/images/catalog/editorial/steel-bundle.jpg": 324396,
  "public/images/catalog/editorial/steel-close.jpg": 168564,
  "public/images/catalog/editorial/wire-coil.jpg": 281467,
  "public/images/catalog/editorial/wire-install.jpg": 158734,
  "public/images/studio/family/neerva-100gaj-photorealistic.webp": 124430,
  "scripts/e2e/mobile-smoke.mjs": 154742,
  "src/modules/studio/designs.json": 199586
};
const imageFile=filename=>/\.(?:webp|png|jpe?g|avif|gif|svg)$/i.test(filename);
const imageTarget=120000,sourceTarget=150000,largest=[],duplicateImages=[];
let imageCount=0,imageBytes=0;
for(const file of tracked){
 const stat=fs.lstatSync(file);if(!stat.isFile())continue;
 const image=imageFile(file),target=image?imageTarget:sourceTarget,limit=Math.max(target,largeFileBaseline[file]??0);
 if(image){imageCount++;imageBytes+=stat.size;}
 if(stat.size>target)largest.push({file,bytes:stat.size,target,limit});
 assert.ok(stat.size<=limit,"Large file exceeds reviewed limit: "+file+" ("+stat.size+" > "+limit+")");
}
const hashes=new Map();
for(const file of tracked.filter(f=>f.startsWith("public/images/")&&imageFile(f))){
 const hash=digest(fs.readFileSync(file)),prior=hashes.get(hash);
 if(prior)duplicateImages.push([prior,file]);else hashes.set(hash,file);
}
assert.equal(duplicateImages.length,0,"Duplicate public images: "+JSON.stringify(duplicateImages));
const retired=["finished","shell"].map(name=>"/images/studio/"+name+".webp");
for(const file of tracked.filter(f=>/^(src\/|public\/sw\.js$)/.test(f)&&/\.(?:ts|tsx|js|mjs|css|json)$/.test(f))){
 const content=fs.readFileSync(file,"utf8");
 for(const old of retired)assert.ok(!content.includes(old),"Retired image reference: "+file+" -> "+old);
}
console.log(JSON.stringify({imageCount,imageBytes,imageTarget,sourceTarget,largeFiles:largest.sort((a,b)=>b.bytes-a.bytes),duplicateImages},null,2));
