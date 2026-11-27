import test from "node:test";
import assert from "node:assert/strict";
import {generateBuildingConcepts,type BuildingBrief} from "./building-purpose.ts";
import {engineeringPreflight} from "./building-engineering.ts";
import {commercialElements} from "./commercial-elements.ts";
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
 const elements=commercialElements(plan);
 assert.equal(snap.boxes.length,3+plan.zones.filter(z=>z.kind==="open"||z.kind==="parking").length+elements.slabs.length+elements.walls.length+elements.portals.filter(p=>p.kind==="exterior-glazing").length);
 assert.ok(snap.boxes.length<2500);
 for(const box of snap.boxes)for(let i=0;i<3;i++)assert.ok(Number.isFinite(box.lo[i])&&box.hi[i]>box.lo[i]);
 for(const p of elements.portals){
  const plane=p.axis==="x"?p.y:p.x,start=p.axis==="x"?p.x:p.y,sill=p.kind==="access"?0:3;
  for(const wall of elements.walls.filter(w=>w.floor===p.floor&&w.axis===p.axis&&Math.abs(w.plane-plane)<1e-5)){
   const overlap=Math.min(wall.end,start+p.length)-Math.max(wall.start,start);
   const height=Math.min(wall.top,8)-Math.max(wall.bottom,sill);
   assert.ok(overlap<1e-5||height<1e-5,"wall cannot fill proposed opening");
  }
 }
 assert.ok(snap.camera.forward.every(Number.isFinite));
});
test("demand arithmetic requires explicit inputs and applies unit conversion",()=>{
 const i={areaSqFt:1000,people:20,deadKpa:2,liveKpa:3,powerWPerM2:10,waterLPerPersonDay:30,ventLpsPerPerson:5};
 const d=calculateConceptDemand(i);assert.ok(d);assert.equal(d.assumedWaterLPerDay,600);assert.equal(d.assumedOutdoorAirLps,100);assert.ok(Math.abs(d.unfactoredDeadKn-185.80608)<1e-6);
 assert.equal(calculateConceptDemand({...i,liveKpa:NaN}),null);assert.equal(calculateConceptDemand({...i,people:2.5}),null);
});
