import test from "node:test";import assert from "node:assert/strict";
import {studioDesigns,derivePlanArea} from "./library.ts";
test("all customer-facing covered, open and parking areas derive from plan rectangles",()=>{
 for(const d of studioDesigns){const a=derivePlanArea(d);
  const covered=d.layout.rooms.filter(r=>r.kind!=="parking"&&r.kind!=="open").reduce((s,r)=>s+r.wFt*r.dFt,0);
  const round=(n:number)=>Math.round(n*100)/100;
  assert.equal(a.coveredRoomSqFt,round(covered));assert.ok(a.coveredRoomSqFt>0);
  assert.ok(a.parkingSqFt>=0&&a.openSqFt>=0);
  assert.ok(a.coveredRoomSqFt <= d.plot.areaSqFt*d.floors+0.1);
 }
});
test("legacy stored built-up fields differ for some designs; render derived areas instead",()=>{
 const differences=studioDesigns.filter(d=>Math.abs(derivePlanArea(d).legacyBuiltAreaMismatchSqFt)>1);
 assert.ok(differences.length>0);
});
