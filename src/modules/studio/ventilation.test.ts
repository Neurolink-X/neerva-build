import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio,portfolioForPlanId,validateRequestedProgramme} from "./road-generator.ts";
import {ventilationReport,ventilationVariant,windowExposure,compassWall} from "./ventilation.ts";
import type {PlanBrief} from "./plan-model.ts";
const base:PlanBrief={widthFt:10.5,depthFt:30,roadSide:"N",floors:1,bedrooms:1,parking:false,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("every supported plot has room-wise ventilation evidence; optional apertures never alter room geometry",()=>{
 for(const [widthFt,depthFt] of [[10.5,30],[15,30],[18,50],[30,60]]){
  const b={...base,widthFt,depthFt},r=generateSpatialPortfolio(b,24);assert.ok(r.plans.length);
  for(const p of r.plans){
   const before=ventilationReport(p),next=ventilationVariant(p),after=ventilationReport(next);
   assert.ok(before.total>=3);assert.equal(before.total,after.total);assert.deepEqual(next.rooms,p.rooms);assert.ok(after.exposed>=before.exposed);
   assert.deepEqual(validateRequestedProgramme(next,b),[]);
   for(const o of next.openings.filter(o=>o.id.startsWith("vent-v1-"))){const room=next.rooms.find(r=>r.id===o.roomId)!;assert.notEqual(windowExposure(next,room,o),"review");}
   if(next.id!==p.id)assert.ok(portfolioForPlanId(b,next.id).plans.some(q=>q.id===next.id));
  }
 }
});
test("zero side setbacks never establish legal side exposure; wall direction follows road orientation",()=>{
 const p=generateSpatialPortfolio(base,1).plans[0];assert.ok(p);
 const r=p.rooms.find(r=>r.x===0&&r.kind==="living")??p.rooms.find(r=>r.x===0&&r.kind==="bedroom")!;
 assert.equal(windowExposure(p,r,{side:"left",atFt:1,widthFt:2}),"review");
 assert.equal(compassWall("front","W"),"W");assert.equal(compassWall("right","W"),"N");
});
