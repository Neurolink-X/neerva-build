import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts} from "./building-purpose.ts";
import {defaultFinishScheme,finishSpaces,applyRoomFinish,shadeRgb} from "./finish-model.ts";
import {buildingFloorSnapshot} from "./building-render.ts";
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
