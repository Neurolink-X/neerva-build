import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio} from "./road-generator.ts";
import {overlapArea,area,type PlanBrief} from "./plan-model.ts";
import {planFurniture,openingClearances} from "./furniture.ts";
const base:PlanBrief={widthFt:40,depthFt:50,floors:2,bedrooms:3,parking:true,roadSide:"N",setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("furniture uses identical plan footprints and never occupies a reserved opening buffer",()=>{
 for(const brief of [base,{...base,widthFt:20,depthFt:40,floors:1 as const,bedrooms:2},{...base,widthFt:36,depthFt:65,bedrooms:6}]){
  const result=generateSpatialPortfolio(brief,24);
  assert.ok(result.plans.length);
  for(const plan of result.plans){
   const pieces=planFurniture(plan);assert.ok(pieces.length);
   assert.deepEqual(pieces,planFurniture(plan));
   assert.equal(new Set(pieces.map(p=>p.id)).size,pieces.length);
   for(const item of pieces){
    const r=plan.rooms.find(r=>r.id===item.roomId);assert.ok(r);
    assert.equal(item.floor,r.floor);
    assert.ok(Math.abs(overlapArea(item,r)-area(item))<1e-6);
    for(const reserved of openingClearances(plan,r))assert.ok(overlapArea(item,reserved)<1e-6);
    for(const other of pieces.filter(p=>p.id!==item.id&&p.floor===item.floor))assert.ok(overlapArea(item,other)<1e-6);
   }
  }
 }
});

test("interior search supports compact homes without obstructing doors or inventing furniture",()=>{
 for(const [widthFt,depthFt] of [[10.5,30],[15,30],[18,50]]){
  const brief:PlanBrief={...base,widthFt,depthFt,floors:1,bedrooms:1,parking:false};
  for(const p of generateSpatialPortfolio(brief).plans){
   const items=planFurniture(p);assert.deepEqual(items,planFurniture(p));
   for(const item of items){const room=p.rooms.find(r=>r.id===item.roomId)!;assert.ok(Math.abs(overlapArea(item,room)-area(item))<1e-6);assert.ok(openingClearances(p,room).every(r=>overlapArea(item,r)<1e-6));}
  }
 }
});
