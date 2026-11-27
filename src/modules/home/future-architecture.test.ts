import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,readdirSync} from "node:fs";
import {createHash} from "node:crypto";
import {futureArchitecture} from "./future-architecture.ts";
test("all six future concepts use distinct verified small local WebP assets",()=>{
 assert.equal(futureArchitecture.length,6);
 assert.equal(new Set(futureArchitecture.map(a=>a.id)).size,6);
 assert.equal(new Set(futureArchitecture.map(a=>a.sha256)).size,6);
 assert.deepEqual(readdirSync("public/images/knowledge/future").sort(),futureArchitecture.map(a=>a.id+".webp").sort());
 let total=0;for(const a of futureArchitecture){
  assert.equal(a.src,"/images/knowledge/future/"+a.id+".webp");
  const b=readFileSync("public"+a.src);assert.equal(b.length,a.bytes);assert.ok(b.length<=45*1024);
  assert.equal(b.subarray(0,4).toString(),"RIFF");assert.equal(b.subarray(8,12).toString(),"WEBP");
  assert.equal(createHash("sha256").update(b).digest("hex"),a.sha256);
  assert.ok(a.width<=600&&a.height<=280&&a.href.startsWith("/")&&a.alt.length>10);
  total+=b.length;
 }
 assert.ok(total<=180*1024);
});
