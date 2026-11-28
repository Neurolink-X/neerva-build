import test from "node:test";
import assert from "node:assert/strict";
import {isOtsRoom,overlapArea,validatePlan,type PlanBrief,type PlanModel} from "./plan-model.ts";
import {generateSpatialPortfolio,portfolioForPlanId,validateRequestedProgramme} from "./road-generator.ts";
import {otsVariant,otsGrilleBars,airOptimizedPlan} from "./ots-ventilation.ts";
import {exposedRoofPatches} from "./plan-surfaces.ts";
const brief:PlanBrief={widthFt:30,depthFt:60,roadSide:"N",floors:2,bedrooms:4,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("shaft alternatives preserve exact programme, no solid roof and deterministic restoration",()=>{
 let found=0;
 for(const b of [brief,{...brief,widthFt:18,depthFt:50,bedrooms:3},{...brief,widthFt:15,depthFt:30,bedrooms:1,parking:false,floors:1 as const},{...brief,widthFt:10.5,depthFt:30,bedrooms:1,parking:false,floors:1 as const}]){
  const r=generateSpatialPortfolio(b);assert.ok(r.plans.length);
  for(const p of r.plans.slice(0,8)){
   const q=otsVariant(p);if(q===p)continue;found++;
   const shafts=q.rooms.filter(isOtsRoom),s=shafts[0];
   assert.equal(shafts.length,q.floors);assert.deepEqual(validateRequestedProgramme(q,b),[]);
   assert.ok(shafts.every(r=>r.x===s.x&&r.y===s.y&&r.w===s.w&&r.d===s.d));
   assert.ok(exposedRoofPatches(q).every(r=>overlapArea(r,s)<1e-5));
   const bars=otsGrilleBars(q);assert.ok(bars.length>6);assert.ok(bars.every(r=>overlapArea(r,s)>0));
   assert.ok(q.openings.some(o=>o.id.startsWith("ots-v1-window-")));
   assert.deepEqual(otsVariant(q),q);
   assert.ok(portfolioForPlanId(b,q.id).plans.some(x=>x.id===q.id));
   const combined=airOptimizedPlan(p,true,true);assert.deepEqual(validatePlan(combined),[]);
   assert.ok(portfolioForPlanId(b,combined.id).plans.some(x=>x.id===combined.id));
  }
 }
 console.log("ots-valid-variants "+found);
 assert.ok(found>0,"At least one real OTS geometry must be feasible");
});
test("rejects a missing or moved upper shaft floor",()=>{
 const p=generateSpatialPortfolio(brief).plans[0];assert.ok(p);
 const q:PlanModel={...p,rooms:[...p.rooms,{id:"ots-v1-floor-0",kind:"terrace",label:"OTS",floor:0,x:0,y:0,w:3,d:3,minClearWidthFt:3}]};
 assert.ok(validatePlan(q).some(e=>e.includes("OTS reserve")));
});

test("attached-house roof-jaal alternatives never create a solid roof over the shaft or pretend an infeasible shaft exists",()=>{const b={...brief,widthFt:18,depthFt:50,bedrooms:3};for(const p of generateSpatialPortfolio(b,8).plans){const q=airOptimizedPlan(p,true,true);assert.deepEqual(validateRequestedProgramme(q,b),[]);const shafts=q.rooms.filter(isOtsRoom);if(!shafts.length){assert.equal(otsGrilleBars(q).length,0);continue;}assert.equal(shafts.length,q.floors);assert.ok(shafts.every(s=>exposedRoofPatches(q).every(r=>overlapArea(r,s)<1e-5)));assert.ok(otsGrilleBars(q).length>0);}});
