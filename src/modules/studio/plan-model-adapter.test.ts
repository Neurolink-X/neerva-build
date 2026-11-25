import test from "node:test";
import assert from "node:assert/strict";
import {generateRoadPlans,generateSpatialPortfolio,planSignature,pickDiverse} from "./road-generator.ts";
import {siteAreaSqFt,rectInsideShape} from "./site-shape.ts";
import {validatePlan} from "./plan-model.ts";
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


test("cosmetic edits and renamed IDs cannot create another architectural layout",()=>{
 const p=generateRoadPlans(brief).plans[0];assert.ok(p);
 const clone={...p,id:"different-name",facade:{...p.facade,kit:"jali-screen" as const},rooms:p.rooms.map(r=>({...r,id:"renamed-"+r.id,label:"Different label"}))};
 assert.equal(planSignature(clone),planSignature(p));assert.equal(pickDiverse([p,clone],24).length,1);
});
test("portfolio parity for all supported outlines, road orientations and every selected floor",()=>{
 for(const shape of [{kind:"rectangle"} as const,{kind:"rear-left-notch",notchWidthFt:2,notchDepthFt:10} as const,{kind:"rear-right-notch",notchWidthFt:2,notchDepthFt:10} as const]){
  for(const roadSide of ["N","E","S","W"] as const){
   const b={...brief,widthFt:22,depthFt:60,roadSide,siteShape:shape};const result=generateSpatialPortfolio(b,6);assert.ok(result.plans.length>1,result.blockers.join(";"));
   assert.equal(new Set(result.plans.map(planSignature)).size,result.plans.length);
   for(const p of result.plans){assert.deepEqual(validatePlan(p),[]);const d=studioDesignFromPlan(p);assert.equal(d.id,p.id);assert.equal(d.plot.areaSqFt,siteAreaSqFt(22,60,shape));assert.ok(p.rooms.every(r=>rectInsideShape(r,22,60,shape)));
    for(let f=0;f<p.floors;f++){const rs=p.rooms.filter(r=>r.floor===f),ds=d.layout.rooms.filter(r=>r.floorIndex===f);assert.equal(rs.length,ds.length);for(const r of rs){const v=ds.find(x=>x.id===r.id)!;assert.deepEqual([v.xFt,v.yFt,v.wFt,v.dFt],[r.x,r.y,r.w,r.d]);assert.deepEqual(v.openings,p.openings.filter(o=>o.roomId===r.id).map(o=>({kind:o.kind,wall:o.side,offsetFt:o.atFt,widthFt:o.widthFt,sillFt:o.sillFt,heightFt:o.heightFt})));}}
   }
  }
 }
});
