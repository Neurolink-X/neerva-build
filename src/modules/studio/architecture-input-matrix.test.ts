import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio,portfolioForPlanId,planSignature,validateRequestedProgramme} from "./road-generator.ts";
import {entranceArrangement,architectureTopology} from "./architecture-profile.ts";
import {frontageComposition} from "./frontage.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {buildingWallCells} from "./geometry.ts";
import type {PlanBrief} from "./plan-model.ts";

const zero={frontFt:0,rearFt:0,leftFt:0,rightFt:0};
const cases:Array<Omit<PlanBrief,"roadSide">>=[
 {widthFt:15,depthFt:30,floors:1,bedrooms:1,parking:false,setbacks:zero},
 {widthFt:16,depthFt:35,floors:1,bedrooms:1,parking:false,setbacks:zero},
 {widthFt:18,depthFt:50,floors:1,bedrooms:1,parking:true,setbacks:zero},
 {widthFt:18,depthFt:50,floors:2,bedrooms:1,parking:false,setbacks:zero},
 {widthFt:20,depthFt:40,floors:1,bedrooms:2,parking:true,setbacks:zero},
 {widthFt:20,depthFt:45,floors:2,bedrooms:2,parking:false,setbacks:zero},
 {widthFt:21.25,depthFt:51.75,floors:3,bedrooms:3,parking:true,setbacks:zero},
 {widthFt:25,depthFt:40,floors:2,bedrooms:3,parking:true,setbacks:zero},
 {widthFt:30,depthFt:50,floors:3,bedrooms:2,parking:false,setbacks:{frontFt:2,rearFt:2,leftFt:1,rightFt:1}},
 {widthFt:30,depthFt:60,floors:2,bedrooms:4,parking:true,setbacks:{frontFt:3,rearFt:2,leftFt:1,rightFt:1}},
 {widthFt:36,depthFt:65,floors:2,bedrooms:5,parking:true,setbacks:zero},
 {widthFt:40,depthFt:60,floors:3,bedrooms:6,parking:true,setbacks:{frontFt:2,rearFt:2,leftFt:2,rightFt:2}},
 {widthFt:40,depthFt:60,floors:1,bedrooms:3,parking:true,setbacks:zero},
 {widthFt:40,depthFt:60,floors:2,bedrooms:6,parking:false,setbacks:zero},
 {widthFt:40,depthFt:70,floors:3,bedrooms:5,parking:true,setbacks:zero,siteShape:{kind:"rear-left-notch",notchWidthFt:5,notchDepthFt:10}},
 {widthFt:40,depthFt:70,floors:2,bedrooms:4,parking:false,setbacks:zero,siteShape:{kind:"rear-right-notch",notchWidthFt:5,notchDepthFt:10}},
 {widthFt:15,depthFt:30,floors:1,bedrooms:6,parking:true,setbacks:zero},
 {widthFt:25,depthFt:40,floors:2,bedrooms:2,parking:true,setbacks:{frontFt:5,rearFt:5,leftFt:5,rightFt:5}}
];
const mesh=(p:ReturnType<typeof generateSpatialPortfolio>["plans"][number])=>buildingWallCells(studioDesignFromPlan(p)).map(c=>[c.floorIndex,c.axis,c.planeFt,c.startFt,c.endFt,c.bottomFt,c.topFt].join(":")).sort().join("|");
test("input coverage matrix: 18 briefs across every road direction, honest feasibility and exact 2D/3D geometry",()=>{
 let feasible=0,blocked=0;
 for(const input of cases)for(const roadSide of ["N","E","S","W"] as const){
  const b:PlanBrief={...input,roadSide},r=generateSpatialPortfolio(b,24);
  if(!r.plans.length){assert.ok(r.blockers.length);blocked++;continue;}
  feasible++;assert.deepEqual(r.blockers,[]);assert.ok(r.plans.length<=24);
  assert.equal(new Set(r.plans.map(p=>p.id)).size,r.plans.length);
  assert.equal(new Set(r.plans.map(planSignature)).size,r.plans.length);
  assert.equal(new Set(r.plans.map(mesh)).size,r.plans.length);
  for(const p of r.plans){
   assert.deepEqual(validateRequestedProgramme(p,b),[],p.id);
   const d=studioDesignFromPlan(p);
   assert.deepEqual(d.layout.rooms.map(x=>[x.id,x.floorIndex,x.xFt,x.yFt,x.wFt,x.dFt]),p.rooms.map(x=>[x.id,x.floor,x.x,x.y,x.w,x.d]));
   assert.equal(d.bedrooms,b.bedrooms);assert.equal(d.floors,b.floors);
  }
  console.log("architecture-matrix "+JSON.stringify({widthFt:b.widthFt,depthFt:b.depthFt,floors:b.floors,bedrooms:b.bedrooms,parking:b.parking,roadSide,shape:b.siteShape?.kind??"rectangle",layouts:r.plans.length,programmes:new Set(r.plans.map(architectureTopology)).size,frontCompositions:new Set(r.plans.map(frontageComposition)).size,frontStairs:r.plans.filter(p=>entranceArrangement(p)==="front-stair").length}));
 }
 assert.ok(feasible>=40);assert.ok(blocked>=8);
 console.log("architecture-matrix-summary "+JSON.stringify({briefs:cases.length*4,feasible,blocked}));
});
test("wide 4–6 BHK portfolios include actual aligned parking-adjacent stair geometry",()=>{
 for(const bedrooms of [4,5,6]){
  const b:PlanBrief={widthFt:36,depthFt:65,floors:2,bedrooms,roadSide:"N",parking:true,setbacks:zero};
  const r=generateSpatialPortfolio(b),legacy=generateSpatialPortfolio(b,24,true);
  assert.equal(r.plans.length,24);
  assert.ok(r.plans.some(p=>p.id.endsWith("-front-core-v1")&&entranceArrangement(p)==="front-stair"));
  assert.equal(r.plans[0].id,legacy.plans[0].id);
  for(const p of legacy.plans)assert.ok(portfolioForPlanId(b,p.id).plans.some(x=>x.id===p.id));
 }
});
