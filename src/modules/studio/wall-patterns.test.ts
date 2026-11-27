import test from "node:test";
import assert from "node:assert/strict";
import {finishes,patternKeys,patternGroups,type Motif} from "./wall-patterns.ts";
import {colourFamilies} from "./colour-families.ts";
test("every non-plain design is in exactly one bounded collection",()=>{
 const keys=Object.values(patternGroups).flat();
 assert.equal(keys.length,19);
 assert.equal(new Set(keys).size,keys.length);
 assert.deepEqual([...keys].sort(),patternKeys.filter(k=>k!=="plain").sort());
 assert.ok(Object.values(patternGroups).every(g=>g.length<=6));
 for(const key of keys)for(const m of finishes[key].motifs as Motif[]){
  assert.ok(m.points.length>=2&&m.points.every(p=>p.every(Number.isFinite)));
  assert.ok((m.alpha??1)>=0&&(m.alpha??1)<=1);
  assert.ok((m.weight??1)>0&&(m.weight??1)<=5);
 }
});
test("curated families expose eight valid distinct shades per family",()=>{
 assert.equal(Object.keys(colourFamilies).length,15);
 for(const shades of Object.values(colourFamilies)){
  assert.equal(shades.length,8);
  assert.equal(new Set(shades).size,8);
  assert.ok(shades.every(s=>/^#[0-9a-f]{6}$/i.test(s)));
 }
 assert.equal(Object.values(colourFamilies).flat().length,120);
});
