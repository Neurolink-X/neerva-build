import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts} from "./building-purpose.ts";
import {defaultFinishScheme} from "./finish-model.ts";
import {buildingFloorSnapshot} from "./building-render.ts";
test("commercial cutaway stays within selected floor height and uses valid boxes",()=>{
 for(const purpose of ["shops","restaurant","school","mall"] as const){
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
  }
 }
});
