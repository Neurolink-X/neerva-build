import test from "node:test";
import assert from "node:assert/strict";
import {area,overlapArea} from "./plan-model.ts";
import {buildingStarter,generateBuildingConcepts,validateBuildingConcept} from "./building-purpose.ts";
import {commercialElements} from "./commercial-elements.ts";
import {commercialInternalSpaces,commercialInternalOpenings} from "./commercial-internal.ts";
import {rentalLayouts} from "./rental-layout.ts";
test("every rental unit has exactly the requested 1–3 bedrooms and independent room programme",()=>{
 for(const rentalBedrooms of [1,2,3])for(const roadSide of ["N","E","S","W"] as const){
  const brief={...buildingStarter("rental"),widthFt:120,depthFt:160,rentalBedrooms,roadSide};
  const {plans}=generateBuildingConcepts(brief);assert.ok(plans.length);
  for(const p of plans){
   assert.deepEqual(validateBuildingConcept(p),[]);
   const units=rentalLayouts(p);assert.equal(units.length,brief.floors*brief.unitsPerFloor);
   for(const u of units){
    const parent=p.zones.find(z=>z.id===u.unitId)!;assert.ok(parent);
    assert.equal(u.rooms.filter(r=>r.kind==="bedroom").length,rentalBedrooms);
    for(const kind of ["living","kitchen","bath","passage"])assert.equal(u.rooms.filter(r=>r.kind===kind).length,1);
    assert.ok(Math.abs(u.rooms.reduce((n,r)=>n+area(r),0)-area(parent))<1e-5);
    for(const [i,r] of u.rooms.entries()){
     assert.equal(r.floor,parent.floor);assert.ok(Math.abs(overlapArea(r,parent)-area(r))<1e-6);
     assert.ok(u.rooms.slice(i+1).every(s=>overlapArea(s,r)<1e-6));
    }
   }
  }
 }
});
test("unsupported rental bedroom count or inadequate plot cannot silently return a smaller BHK",()=>{
 const b=buildingStarter("rental");
 assert.equal(generateBuildingConcepts({...b,rentalBedrooms:4}).plans.length,0);
 assert.equal(generateBuildingConcepts({...b,rentalBedrooms:3,widthFt:30,depthFt:50}).plans.length,0);
});

test("legacy rental 2D room partitions are represented in the opening-aware 3D wall model",()=>{
 const plan=generateBuildingConcepts({...buildingStarter("rental"),widthFt:120,depthFt:180,rentalBedrooms:2},1).plans[0];assert.ok(plan);
 const rooms=commercialInternalSpaces(plan),model=commercialElements(plan),doors=commercialInternalOpenings(plan);
 assert.equal(rooms.length,rentalLayouts(plan).flatMap(u=>u.rooms).length);
 for(const r of rooms.filter(r=>r.kind==="bedroom")){
  assert.ok(doors.some(d=>d.zoneId===r.id&&d.kind==="access"));
  assert.ok(model.walls.some(w=>w.floor===r.floor&&w.axis==="y"&&Math.abs(w.plane-r.x)<1e-5&&Math.min(w.end,r.y+r.d)-Math.max(w.start,r.y)>1e-5));
 }
});
