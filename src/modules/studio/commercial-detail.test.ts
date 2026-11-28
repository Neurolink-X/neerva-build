import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts} from "./building-purpose.ts";
import {commercialFixtures,commercialPortals,commercialFrontPanels,commercialGeometryIssues,portalClearance} from "./commercial-detail.ts";
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
    for(const a of portals.filter(a=>a.zoneId===f.zoneId))assert.ok(overlapArea(f,portalClearance(a))<1e-6);
   }
   for(const f of commercialFrontPanels(p)){
    const z=p.zones.find(z=>z.id===f.zoneId);assert.ok(z);assert.equal(f.y,z.y);
    assert.ok(f.x>=z.x-1e-6&&f.x+f.w<=z.x+z.w+1e-6);
   }
   assert.deepEqual(commercialFixtures(p),fixtures);
  }
 }
});

test("transverse gallery has connected room entrances and two modeled side approaches",()=>{
 const plans=generateBuildingConcepts(buildingStarter("shops"),24,"cross-gallery").plans;assert.ok(plans.length);
 for(const plan of plans){const hall=plan.zones.find(z=>z.kind==="circulation")!;const openings=commercialPortals(plan);assert.deepEqual(commercialGeometryIssues(plan),[]);assert.equal(openings.filter(p=>p.zoneId===hall.id&&p.kind==="access"&&p.axis==="y").length,2);for(const z of plan.zones.filter(z=>!["open","parking","circulation"].includes(z.kind)))assert.ok(openings.some(p=>p.zoneId===z.id&&p.connectsTo===hall.id&&p.axis==="x"&&p.kind==="access"),z.id);}
});
