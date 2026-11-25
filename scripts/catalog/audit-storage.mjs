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
