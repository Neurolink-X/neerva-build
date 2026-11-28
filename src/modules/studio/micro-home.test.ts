import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio,portfolioForPlanId,validateRequestedProgramme,planSignature} from "./road-generator.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {buildingWallCells} from "./geometry.ts";
import type {PlanBrief} from "./plan-model.ts";
const base:PlanBrief={widthFt:10.5,depthFt:30,roadSide:"N",floors:1,bedrooms:1,parking:false,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
const mesh=(p:ReturnType<typeof generateSpatialPortfolio>["plans"][number])=>buildingWallCells(studioDesignFromPlan(p)).map(c=>[c.floorIndex,c.axis,c.planeFt,c.startFt,c.endFt,c.bottomFt,c.topFt].join(":")).sort().join("|");
test("35–100 gaj compact inputs retain the exact room programme and road orientation",()=>{
 const cases=[{widthFt:10.5,depthFt:30},{widthFt:12,depthFt:26.25},{widthFt:12,depthFt:30},{widthFt:15,depthFt:30},{widthFt:15,depthFt:36},{widthFt:18,depthFt:40},{widthFt:18,depthFt:50},{widthFt:10.5,depthFt:30,floors:2 as const},{widthFt:15,depthFt:30,floors:2 as const,bedrooms:2},{widthFt:15,depthFt:30,floors:2 as const,bedrooms:2,parking:true}];
 for(const input of cases)for(const roadSide of ["N","E","S","W"] as const){
  const b:PlanBrief={...base,...input,roadSide},r=generateSpatialPortfolio(b);
  assert.ok(r.plans.length,JSON.stringify(b)+" "+r.blockers.join(" / "));
  assert.deepEqual(r.blockers,[]);
  assert.equal(new Set(r.plans.map(planSignature)).size,r.plans.length);
  assert.equal(new Set(r.plans.map(mesh)).size,r.plans.length);
  for(const p of r.plans){
   assert.deepEqual(validateRequestedProgramme(p,b),[],p.id);
   const d=studioDesignFromPlan(p);assert.equal(d.bedrooms,b.bedrooms);assert.equal(d.floors,b.floors);assert.equal(d.plot.widthFt,b.widthFt);assert.equal(d.plot.depthFt,b.depthFt);
  }
  assert.equal(generateSpatialPortfolio(b,1).plans[0].id,r.plans[0].id);
  assert.ok(portfolioForPlanId(b,r.plans.at(-1)!.id).plans.some(p=>p.id===r.plans.at(-1)!.id));
  console.log("compact-gaj-coverage "+JSON.stringify({gaj:b.widthFt*b.depthFt/9,roadSide,bedrooms:b.bedrooms,floors:b.floors,parking:b.parking,count:r.plans.length}));
 }
});
test("small infeasible parking and setbacks are not silently relaxed",()=>{
 for(const b of [{...base,parking:true},{...base,bedrooms:6},{...base,setbacks:{frontFt:3,rearFt:3,leftFt:1,rightFt:1}}]){
  const r=generateSpatialPortfolio(b);assert.equal(r.plans.length,0);assert.ok(r.blockers.length);
 }
});
