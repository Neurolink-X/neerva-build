import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fieldCases,globalMethods,referenceReview} from "./practical-field-guide.ts";
test("practical field guides remain actionable and distinct",()=>{
 assert.equal(new Set(fieldCases.map(c=>c.id)).size,fieldCases.length);
 for(const c of fieldCases){assert.ok(c.checks.length>=3);assert.ok(c.proof.length>15&&c.stop.length>10&&c.exercise.length>20);assert.ok(c.href.startsWith("/")&&!c.href.startsWith("//"));}
});
test("global methods have verified official reference locations and contextual limits",()=>{
 assert.match(referenceReview.date,/^\d{4}-\d{2}-\d{2}$/);
 const allowed=new Set(["www.ndrc.gov.cn","www.mlit.go.jp","www1.bca.gov.sg"]);
 assert.equal(new Set(globalMethods.map(m=>m.country)).size,globalMethods.length);
 for(const m of globalMethods){const u=new URL(m.url);assert.equal(u.protocol,"https:");assert.ok(allowed.has(u.hostname));assert.ok(m.evidence&&m.method&&m.limits&&m.metric&&m.apply);}
});
test("field and global guides render local text without client animation or external embeds",()=>{
 for(const file of ["visual-site-lab","china-construction","future-home-lab","workmanship-library"]){
  const code=readFileSync("src/components/"+file+".tsx","utf8");
  assert.doesNotMatch(code,/"use client"|<svg\b|<canvas\b|<iframe\b|<video\b|<Image\b|<img\b|\bfetch\s*\(/);
 }
 const global=readFileSync("src/components/china-construction.tsx","utf8");
 assert.match(global,/rel="noopener noreferrer"/);assert.match(global,/referrerPolicy="no-referrer"/);
});
