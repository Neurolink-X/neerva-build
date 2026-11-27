import test from "node:test";
import assert from "node:assert/strict";
import {generateBuildingConcepts,type BuildingBrief} from "./building-purpose.ts";
import {engineeringPreflight} from "./building-engineering.ts";
import {buildingRenderSnapshot} from "./building-render.ts";
import {calculateConceptDemand} from "./building-demand.ts";
const brief:BuildingBrief={purpose:"school",widthFt:180,depthFt:240,roadSide:"N",floors:3,unitsPerFloor:4,parkingBays:8,frontFt:40,rearFt:25,sideFt:10};
test("engineering review is geometry-linked and can never issue a construction approval",()=>{
 const {plans}=generateBuildingConcepts(brief,3);assert.ok(plans.length);
 for(const plan of plans){
  const r=engineeringPreflight(plan);assert.equal(r.planId,plan.id);assert.equal(r.approval,"NOT_ENGINEERED");
  assert.deepEqual(r.blockers,[]);assert.equal(r.floors.length,brief.floors);
  const gross=plan.zones.filter(z=>z.kind!=="open"&&z.kind!=="parking").reduce((n,z)=>n+z.w*z.d,0);
  assert.ok(Math.abs(gross-r.grossSqFt)<1e-5);
  for(const floor of r.floors){
   assert.ok(floor.coreReserveSqFt>0);
   for(const route of floor.routes){assert.ok(route.nearestFt!==null&&route.oneCoreUnavailableFt!==null);assert.ok(route.oneCoreUnavailableFt>=route.nearestFt);}
  }
  const invalid=engineeringPreflight({...plan,zones:[]});assert.ok(invalid.blockers.length);assert.equal(invalid.approval,"NOT_ENGINEERED");assert.deepEqual(invalid.floors,[]);
 }
});
test("massing renderer uses exact zone extents with bounded camera and no synthetic openings",()=>{
 const plan=generateBuildingConcepts(brief,1).plans[0];assert.ok(plan);
 const snap=buildingRenderSnapshot(plan);
 assert.equal(snap.boxes.length,plan.zones.length+3);assert.ok(snap.boxes.length<2500);
 for(const [i,z] of plan.zones.entries()){
  const b=snap.boxes[i+3];assert.ok(Math.abs(b.hi[0]-b.lo[0]-z.w*.3048)<1e-7);
  assert.ok(Math.abs(b.hi[2]-b.lo[2]-z.d*.3048)<1e-7);
  assert.ok(Math.abs(b.lo[1]-z.floor*13*.3048)<1e-7);
 }
 assert.ok(snap.camera.forward.every(Number.isFinite));
});
test("demand arithmetic requires explicit inputs and applies unit conversion",()=>{
 const i={areaSqFt:1000,people:20,deadKpa:2,liveKpa:3,powerWPerM2:10,waterLPerPersonDay:30,ventLpsPerPerson:5};
 const d=calculateConceptDemand(i);assert.ok(d);assert.equal(d.assumedWaterLPerDay,600);assert.equal(d.assumedOutdoorAirLps,100);assert.ok(Math.abs(d.unfactoredDeadKn-185.80608)<1e-6);
 assert.equal(calculateConceptDemand({...i,liveKpa:NaN}),null);assert.equal(calculateConceptDemand({...i,people:2.5}),null);
});
