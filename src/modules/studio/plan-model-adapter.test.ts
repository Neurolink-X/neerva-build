import test from "node:test";
import assert from "node:assert/strict";
import {generateRoadPlans} from "./road-generator.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {buildingWallCells} from "./geometry.ts";
import type {PlanBrief} from "./plan-model.ts";
const brief:PlanBrief={widthFt:18,depthFt:50,roadSide:"E",floors:2,bedrooms:3,parking:true,
 setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("2D PlanModel and legacy Three.js adapter use the same exact rooms, openings and stair alignment",()=>{
 for(const p of generateRoadPlans(brief).plans){
  const d=studioDesignFromPlan(p);
  assert.equal(d.plot.widthFt,p.plot.widthFt);
  assert.equal(d.plot.depthFt,p.plot.depthFt);
  assert.equal(d.facing,"East");
  assert.equal(d.layout.rooms.length,p.rooms.length);
  for(const room of p.rooms){
   const derived=d.layout.rooms.find(r=>r.id===room.id);
   assert.ok(derived,room.id);
   assert.deepEqual([derived.xFt,derived.yFt,derived.wFt,derived.dFt,derived.floorIndex],
    [room.x,room.y,room.w,room.d,room.floor]);
   assert.equal(derived.openings.length,p.openings.filter(o=>o.roomId===room.id).length);
  }
  assert.equal(d.layout.wallThicknessFt,p.walls.internalFt);
  const cells=buildingWallCells(d);
  assert.ok(cells.length>20,"Actual walls with door/window voids must reach 3D tessellation");
  for(const c of cells){
   assert.ok(c.endFt>c.startFt&&c.topFt>c.bottomFt);
   assert.ok(c.floorIndex>=0&&c.floorIndex<p.floors);
  }
 }
});
test("left and right parking variants send different real gate coordinates to the viewer",()=>{
 const [a,b]=generateRoadPlans(brief).plans;
 assert.ok(a&&b);
 assert.notEqual(a.gate.xFt,b.gate.xFt);
 assert.equal(a.gate.side,"front");assert.equal(b.gate.side,"front");
 assert.notEqual(a.pedestrianGate.xFt,b.pedestrianGate.xFt);
 for(const p of [a,b]){
  const park=p.rooms.find(r=>r.id===p.parking?.roomId)!;
  assert.ok(p.gate.xFt>=park.x);
  assert.ok(p.gate.xFt+p.gate.widthFt<=park.x+park.w);
  const entry=p.rooms.find(r=>r.kind==="verandah")!;
  assert.ok(p.pedestrianGate.xFt>=entry.x&&p.pedestrianGate.xFt+p.pedestrianGate.widthFt<=entry.x+entry.w);
  assert.ok(Math.max(p.gate.xFt,p.pedestrianGate.xFt)>=Math.min(p.gate.xFt+p.gate.widthFt,p.pedestrianGate.xFt+p.pedestrianGate.widthFt));
 }
});
