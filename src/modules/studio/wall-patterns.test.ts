import test from "node:test";
import assert from "node:assert/strict";
import {finishes,patternKeys,patternGroups,retiredPatterns,groupForPattern,isRetiredPattern,type Motif} from "./wall-patterns.ts";
import {colourFamilies,colourPairings} from "./colour-families.ts";
test("curated wall library exposes exactly 72 designs and preserves retired IDs",()=>{
 const keys=Object.values(patternGroups).flat();
 assert.equal(keys.length,72);
 assert.equal(new Set(keys).size,keys.length);
 assert.deepEqual([...keys,...retiredPatterns].sort(),patternKeys.filter(k=>k!=="plain").sort());
 assert.ok(retiredPatterns.every(k=>isRetiredPattern(k)&&groupForPattern(k)==="Signature"));
 assert.ok(keys.every(k=>!isRetiredPattern(k)));
 assert.ok(Object.values(patternGroups).every(g=>g.length===8));
 assert.equal(patternGroups.Murals.length,8);assert.ok(patternGroups.Murals.every(k=>finishes[k].motifs.length>=3));
 assert.equal(patternGroups.Geometry.length,8);assert.ok(keys.includes("herringbone"));assert.ok(keys.includes("facets"));
 assert.ok(keys.includes("waterflow"));assert.ok(keys.includes("sunDisc"));assert.ok(keys.includes("floralScroll"));assert.ok(keys.includes("bamboo"));assert.ok(patternKeys.includes("mural"),"existing bottom mural remains available");
 assert.equal(new Set(keys.map(k=>JSON.stringify(finishes[k].motifs))).size,keys.length,"each design has distinct actual motifs");
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

test("curated premium pairings use distinct named shades from the shared palette",()=>{
 const shades=new Set<string>(Object.values(colourFamilies).flat());
 assert.equal(colourPairings.length,6);assert.equal(new Set(colourPairings.map(p=>p.id)).size,6);
 for(const p of colourPairings){assert.ok(shades.has(p.base));assert.ok(shades.has(p.accent));assert.notEqual(p.base as string,p.accent as string);}
});
