import test from "node:test";
import assert from "node:assert/strict";
import {buildingPurposes,buildingStarter,generateBuildingConcepts} from "./building-purpose.ts";
import {defaultFinishScheme,finishSpaces,applyRoomFinish,shadeRgb} from "./finish-model.ts";
import {buildingFloorSnapshot,buildingRenderSnapshot} from "./building-render.ts";
test("commercial cutaway stays within selected floor height and uses valid boxes",()=>{
 for(const purpose of ["shops","restaurant","school","mall","rental"] as const){
  const plan=generateBuildingConcepts(buildingStarter(purpose),1).plans[0];
  assert.ok(plan,purpose);
  const scheme=defaultFinishScheme({kind:"commercial",plan});
  for(let floor=0;floor<plan.brief.floors;floor++){
   const snapshot=buildingFloorSnapshot(plan,floor,scheme);
   assert.ok(snapshot.boxes.length);
   for(const box of snapshot.boxes){
    assert.ok(box.lo.every(Number.isFinite)&&box.hi.every(Number.isFinite));
    assert.ok(box.hi.every((v,i)=>v>box.lo[i]));
    assert.ok(box.lo[1]>=0&&box.hi[1]<=7*.3048+1e-8);
   }
   assert.deepEqual(snapshot,buildingFloorSnapshot(plan,floor,scheme));
   const full=buildingFloorSnapshot(plan,floor,scheme,true);
   assert.ok(full.boxes.every(b=>b.lo[1]>=0&&b.hi[1]<=13*.3048+1e-8));
   assert.ok(full.boxes.some(b=>b.hi[1]>7*.3048),"full-height wall segments remain available");
  }
 }
});

test("room finish colours are visible on selected commercial floor without changing walls or slabs",()=>{
 const plan=generateBuildingConcepts(buildingStarter("restaurant"),1).plans[0];assert.ok(plan);
 const source={kind:"commercial" as const,plan},room=finishSpaces(source).find(r=>r.floor===0&&r.kind==="primary");assert.ok(room);
 const original=defaultFinishScheme(source),scheme=applyRoomFinish(source,applyRoomFinish(source,original,[room.id],"wall","#112233"),[room.id],"floor","#abcdef");
 const before=buildingFloorSnapshot(plan,0,original),after=buildingFloorSnapshot(plan,0,scheme);
 assert.deepEqual(before.boxes.map(b=>[b.lo,b.hi]),after.boxes.map(b=>[b.lo,b.hi]));
 assert.ok(after.boxes.some(b=>b.color.every((v,i)=>v===shadeRgb("#112233")[i])));
 assert.ok(after.boxes.some(b=>b.color.every((v,i)=>v===shadeRgb("#abcdef")[i])));
});

import {commercialFacadeProfile,commercialFrontPanels} from "./commercial-detail.ts";
import {commercialElements} from "./commercial-elements.ts";
test("all five purpose facades use the shared band size and preserve the selected opening geometry",()=>{
 const profiles=new Set<number>();
 for(const purpose of buildingPurposes){
  const plan=generateBuildingConcepts(buildingStarter(purpose),1).plans[0];assert.ok(plan,purpose);
  const profile=commercialFacadeProfile(purpose),scheme=defaultFinishScheme({kind:"commercial",plan}),model=buildingRenderSnapshot(plan,"limestone",false,"front",scheme);
  profiles.add(profile.bandFt);
  assert.ok(model.boxes.every(b=>b.hi.every((v,i)=>Number.isFinite(v)&&Number.isFinite(b.lo[i])&&v>b.lo[i])));
  const panels=commercialFrontPanels(plan).filter(p=>p.w*.3048>=.6);
  assert.ok(panels.length);
  for(const p of panels){const top=(p.floor*13+12.5)*.3048;
   assert.ok(model.boxes.some(b=>Math.abs(b.hi[1]-top)<1e-7&&Math.abs(b.hi[1]-b.lo[1]-profile.bandFt*.3048)<1e-7&&Math.abs(b.hi[0]-b.lo[0]-p.w*.3048)<1e-7),purpose+" facade band");
  }
  const portals=commercialElements(plan).portals.filter(p=>p.floor===0&&p.kind==="exterior-glazing");
  const cut=buildingFloorSnapshot(plan,0,scheme);
  for(const p of portals){const x=(p.x-plan.brief.widthFt/2)*.3048,z=(p.y-plan.brief.depthFt/2)*.3048;
   assert.ok(cut.boxes.some(b=>b.opacity<.98&&b.lo[1]>=3*.3048-1e-7&&b.hi[1]<=7*.3048+1e-7&&(p.axis==="x"?Math.abs(b.lo[2]-(z-.035))<1e-7:Math.abs(b.lo[0]-(x-.035))<1e-7)));
  }
 }
 assert.equal(profiles.size,buildingPurposes.length);
});

test("commercial presentation site remains compact and all structural geometry stays inside the selected plot",()=>{
 for(const purpose of buildingPurposes){
  const plan=generateBuildingConcepts(buildingStarter(purpose),1).plans[0];assert.ok(plan);
  const {widthFt,depthFt}=plan.brief,s=buildingRenderSnapshot(plan),ground=s.boxes[0],margin=Math.max(1.2,Math.min(3.2,Math.min(widthFt,depthFt)*.3048*.08));
  assert.ok(Math.abs(ground.hi[0]-ground.lo[0]-(widthFt*.3048+2*margin))<1e-8);
  assert.ok(Math.abs(ground.hi[2]-ground.lo[2]-(depthFt*.3048+2*margin+2))<1e-8);
  assert.ok(s.boxes.every(b=>b.hi.every((v,i)=>Number.isFinite(v)&&v>b.lo[i])));
 }
});

import {floorPreviewFixtures,portalClearance,commercialPortals} from "./commercial-detail.ts";
import {commercialFixtureBoxes} from "./commercial-fixture-render.ts";
import {overlapArea} from "./plan-model.ts";
test("commercial furnished cutaways reuse exact selected-floor 2D footprints across five purposes and road directions",()=>{
 for(const purpose of buildingPurposes)for(const roadSide of ["N","E","S","W"] as const){
  const brief={...buildingStarter(purpose),roadSide},plan=generateBuildingConcepts(brief,1,"purpose-led").plans[0];assert.ok(plan);
  const scheme=defaultFinishScheme({kind:"commercial",plan});
  for(let floor=0;floor<brief.floors;floor++){
   const fixtures=floorPreviewFixtures(plan,floor);assert.ok(fixtures.length<=48);
   const plain=buildingFloorSnapshot(plan,floor,scheme),furnished=buildingFloorSnapshot(plan,floor,scheme,false,true);
   assert.deepEqual(furnished.boxes.slice(0,plain.boxes.length),plain.boxes);
   const expected=fixtures.flatMap(f=>commercialFixtureBoxes(f,brief.widthFt/2,brief.depthFt/2));
   assert.deepEqual(furnished.boxes.slice(plain.boxes.length),expected);assert.ok(expected.length<=192);
   for(const f of fixtures){
    assert.equal(f.floor,floor);
    for(const door of commercialPortals(plan).filter(p=>p.floor===floor&&(p.zoneId===f.zoneId||p.connectsTo===f.zoneId)))assert.ok(overlapArea(f,portalClearance(door))<1e-5);
    for(const b of commercialFixtureBoxes(f,brief.widthFt/2,brief.depthFt/2)){
     assert.ok(b.lo[0]>=(f.x-brief.widthFt/2)*.3048-1e-8&&b.hi[0]<=(f.x+f.w-brief.widthFt/2)*.3048+1e-8);
     assert.ok(b.lo[2]>=(f.y-brief.depthFt/2)*.3048-1e-8&&b.hi[2]<=(f.y+f.d-brief.depthFt/2)*.3048+1e-8);
    }
   }
  }
 }
});
