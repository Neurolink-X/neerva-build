import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,buildingLayoutFamily,generateBuildingConcepts,validateBuildingConcept} from "./building-purpose.ts";
import {commercialInternalSpaces,commercialInternalOpenings,internalGeometryIssues,commercialStairStudies} from "./commercial-internal.ts";
import {overlapArea} from "./plan-model.ts";
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

test("detailed commercial stair footprints and shaft openings use the same generated geometry",()=>{
 const brief={...buildingStarter("rental"),widthFt:140,depthFt:200,floors:2,unitsPerFloor:2,rentalBedrooms:2};
 const plans=generateBuildingConcepts(brief,24,"internal").plans;assert.ok(plans.length);
 assert.ok(plans.some(p=>p.id.endsWith("-internal-v1-3")),"exterior-side kitchen must be an actual distinct option");
 let checked=0;
 for(const plan of plans){
  const rooms=commercialInternalSpaces(plan),review=commercialStairStudies(plan),elements=commercialElements(plan);
  for(const shaft of rooms.filter(r=>r.floor>0&&["lift","shaft"].includes(r.kind))){
   assert.ok(elements.slabs.filter(s=>s.floor===shaft.floor&&s.bottom===0).every(s=>overlapArea(s,shaft)<1e-5),"shaft must not be blocked by intermediate slab");
  }
  for(const flight of review.studies){
   checked++;
   const bay=rooms.find(r=>r.id===flight.roomId)!;assert.ok(bay);
   assert.ok(flight.steps.length>0&&flight.landings.length===3);
   assert.ok(flight.steps.every(r=>Math.abs(overlapArea(r,bay)-r.w*r.d)<1e-5));
   assert.ok(commercialInternalOpenings(plan).some(p=>p.zoneId===flight.roomId&&p.id.endsWith("-departure")));
   assert.ok(commercialInternalOpenings(plan).some(p=>p.zoneId===flight.upperRoomId&&p.id.endsWith("-arrival")));
  }
 }
 assert.ok(checked>0,"a spacious two-level building should support a secondary stair concept");
});

test("lift is explicitly optional; stairs remain on every level and project identity is distinct",()=>{
 const b={...buildingStarter("rental"),widthFt:140,depthFt:200,floors:2,unitsPerFloor:2,rentalBedrooms:2};
 for(const reserveLift of [false,true]){
  const brief={...b,reserveLift},plans=generateBuildingConcepts(brief,24,"internal").plans;assert.ok(plans.length);
  for(const p of plans.slice(0,3)){
   const spaces=commercialInternalSpaces(p);assert.equal(spaces.filter(r=>r.kind==="lift").length,reserveLift?2:0);
   assert.equal(spaces.filter(r=>r.kind==="stairs").length,4);
   assert.ok(commercialStairStudies(p).studies.length>=1);
   assert.deepEqual(internalGeometryIssues(p),[]);
   const input=commercialSaveSchema.parse({idempotencyKey:"c71a9c10-4c52-4df4-85b7-04d0efbb181f",title:"Lift preference test",brief,planId:p.id,signature:p.signature,finishes:defaultFinishScheme({kind:"commercial",plan:p})});
   assert.equal(rebuildCommercialSnapshot(input)?.plan.id,p.id);
   assert.equal(rebuildCommercialSnapshot({...input,brief:{...brief,reserveLift:!reserveLift}}),null);
  }
 }
 assert.equal(generateBuildingConcepts({...b,floors:1,reserveLift:true},24,"internal").plans.length,0);
});

test("non-rental internal variants include distinct service room dimensions",()=>{
 const b={...buildingStarter("restaurant"),widthFt:180,depthFt:240,floors:2,unitsPerFloor:4};
 const plans=generateBuildingConcepts(b,24,"internal").plans;
 assert.ok(plans.some(p=>p.id.endsWith("-internal-v1-1")||p.id.endsWith("-internal-v1-3")));
 for(const p of plans){assert.deepEqual(validateBuildingConcept(p),[]);assert.deepEqual(commercialGeometryIssues(p),[]);}
});
