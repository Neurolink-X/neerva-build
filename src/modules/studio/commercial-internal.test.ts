import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,buildingLayoutFamily,generateBuildingConcepts,validateBuildingConcept} from "./building-purpose.ts";
import {commercialInternalSpaces,commercialInternalOpenings,internalGeometryIssues} from "./commercial-internal.ts";
import {commercialElements} from "./commercial-elements.ts";
import {commercialGeometryIssues} from "./commercial-detail.ts";
import {rentalLayouts} from "./rental-layout.ts";
import {defaultFinishScheme} from "./finish-model.ts";
import {commercialSaveSchema,rebuildCommercialSnapshot} from "./commercial-save.ts";
test("detailed rental layouts retain input and have actual different internal topology",()=>{
 for(const rentalBedrooms of [1,2,3]){
  const brief={...buildingStarter("rental"),widthFt:120,depthFt:180,rentalBedrooms,unitsPerFloor:2};
  const result=generateBuildingConcepts(brief,24,"internal");
  assert.ok(result.plans.length>1);
  assert.ok(result.plans.some(p=>p.id.endsWith("-internal-v1-2")));
  assert.ok(result.plans.some(p=>p.id.endsWith("-internal-v1-0")));
  assert.equal(new Set(result.plans.map(p=>p.signature)).size,result.plans.length);
  for(const p of result.plans.slice(0,4)){
   assert.deepEqual(p.brief,brief);assert.equal(buildingLayoutFamily(p.id),"internal");
   assert.deepEqual(validateBuildingConcept(p),[]);assert.deepEqual(internalGeometryIssues(p),[]);assert.deepEqual(commercialGeometryIssues(p),[]);
   const rooms=commercialInternalSpaces(p),doors=commercialInternalOpenings(p);
   assert.equal(rooms.filter(r=>r.kind==="lift").length,brief.floors);
   assert.equal(rooms.filter(r=>r.kind==="stairs").length,brief.floors*2);
   for(const u of rentalLayouts(p))assert.equal(u.rooms.filter(r=>r.kind==="bedroom").length,rentalBedrooms);
   for(const r of rooms.filter(r=>r.kind==="bedroom"))assert.ok(doors.some(d=>d.zoneId===r.id&&d.kind==="access"));
   const elements=commercialElements(p);
   for(const d of doors){
    const plane=d.axis==="y"?d.x:d.y,start=d.axis==="y"?d.y:d.x;
    for(const w of elements.walls.filter(w=>w.floor===d.floor&&w.axis===d.axis&&Math.abs(w.plane-plane)<1e-5)){
     const overlap=Math.min(w.end,start+d.length)-Math.max(w.start,start);
     const height=Math.min(w.top,8)-Math.max(w.bottom,d.kind==="access"?0:3);
     assert.ok(overlap<1e-5||height<1e-5,"partition must not close actual opening");
    }
   }
   const input=commercialSaveSchema.parse({idempotencyKey:"c71a9c10-4c52-4df4-85b7-04d0efbb181f",title:"Apartment layout",brief,planId:p.id,signature:p.signature,finishes:defaultFinishScheme({kind:"commercial",plan:p})});
   assert.equal(rebuildCommercialSnapshot(input)?.plan.id,p.id);
  }
 }
});
test("purpose-specific service rooms on commercial buildings use checked openings",()=>{
 for(const purpose of ["mall","school","restaurant","shops"] as const){
  const brief={...buildingStarter(purpose),widthFt:180,depthFt:240,floors:2,unitsPerFloor:4};
  const result=generateBuildingConcepts(brief,24,"internal");assert.ok(result.plans.length,purpose);
  for(const p of result.plans.slice(0,3)){assert.deepEqual(validateBuildingConcept(p),[]);assert.deepEqual(commercialGeometryIssues(p),[]);
   const rooms=commercialInternalSpaces(p);assert.equal(rooms.filter(r=>r.kind==="service-a").length,brief.floors*2);assert.equal(rooms.filter(r=>r.kind==="lift").length,brief.floors);}
 }
});
