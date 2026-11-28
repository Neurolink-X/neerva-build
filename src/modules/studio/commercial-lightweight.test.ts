import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts} from "./building-purpose.ts";
import {defaultFinishScheme} from "./finish-model.ts";
import {buildingFloorSnapshot,buildingRenderSnapshot} from "./building-render.ts";
import {projectCommercialScene} from "./commercial-lightweight.ts";
test("lightweight commercial projection uses exactly the opening-aware 3D scene",()=>{
 for(const family of ["purpose-led","cross-gallery"] as const){
  const plan=generateBuildingConcepts(buildingStarter("shops"),1,family).plans[0];assert.ok(plan);
  const scheme=defaultFinishScheme({kind:"commercial",plan});
  for(const scene of [buildingFloorSnapshot(plan,0,scheme),buildingRenderSnapshot(plan,"limestone",false,"front",scheme)]){
   const first=projectCommercialScene(scene,0);assert.ok(first);
   assert.equal(first.faces.length,scene.boxes.length*3);
   assert.ok(first.faces.every(f=>!f.points.includes("NaN")&&f.opacity>=0&&f.opacity<=1));
   assert.notDeepEqual(first,projectCommercialScene(scene,1));
   assert.equal(projectCommercialScene({...scene,boxes:[]},0),null);
  }
 }
});
