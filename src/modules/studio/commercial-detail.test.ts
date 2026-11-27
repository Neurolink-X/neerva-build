import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts} from "./building-purpose.ts";
import {commercialFixtures,commercialPortals,commercialFrontPanels,commercialGeometryIssues} from "./commercial-detail.ts";
import {overlapArea,area} from "./plan-model.ts";
test("purpose furniture and candidate openings are contained in actual selected geometry",()=>{
 for(const purpose of ["mall","school","restaurant","shops"] as const){
  const plans=generateBuildingConcepts(buildingStarter(purpose),3).plans;
  assert.ok(plans.length,purpose);
  for(const p of plans){
   assert.deepEqual(commercialGeometryIssues(p),[]);
   const fixtures=commercialFixtures(p),portals=commercialPortals(p);
   assert.ok(fixtures.length);assert.ok(portals.length);
   for(const f of fixtures){
    const z=p.zones.find(z=>z.id===f.zoneId);assert.ok(z);
    assert.ok(Math.abs(overlapArea(f,z)-area(f))<1e-6);
    for(const a of portals.filter(a=>a.zoneId===f.zoneId))assert.ok(overlapArea(f,{x:a.x-4,y:a.y-2,w:8,d:a.length+4})<1e-6);
   }
   for(const f of commercialFrontPanels(p)){
    const z=p.zones.find(z=>z.id===f.zoneId);assert.ok(z);assert.equal(f.y,z.y);
    assert.ok(f.x>=z.x-1e-6&&f.x+f.w<=z.x+z.w+1e-6);
   }
   assert.deepEqual(commercialFixtures(p),fixtures);
  }
 }
});
