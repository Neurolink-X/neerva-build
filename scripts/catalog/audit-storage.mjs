import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";
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
