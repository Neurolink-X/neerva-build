import test from "node:test";
import assert from "node:assert/strict";
import {projectPoint,projectRect,siteProjection} from "./orientation.ts";
import {generateRoadPlans} from "./road-generator.ts";
import type {PlanBrief,RoadSide} from "./plan-model.ts";
const base:PlanBrief={widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("four compass projections map local y=0 to physical road edge, without distortion",()=>{
 for(const side of ["N","E","S","W"] as RoadSide[]){
  const v=siteProjection(18,50,side);
  const left=projectPoint({x:0,y:0},18,50,side),right=projectPoint({x:18,y:0},18,50,side);
  assert.equal(Math.hypot(right.x-left.x,right.y-left.y),18);
  if(side==="N")assert.equal(left.y,0);
  if(side==="E")assert.equal(left.x,v.widthFt);
  if(side==="S")assert.equal(left.y,v.depthFt);
  if(side==="W")assert.equal(left.x,0);
  const r=projectRect({x:0,y:0,w:8.5,d:16},18,50,side);
  assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=v.widthFt&&r.y+r.d<=v.depthFt);
  assert.ok(Math.abs(r.w*r.d-136)<1e-8);
 }
});
test("actual road-front parking and pedestrian gates project to the same edge in every direction",()=>{
 for(const roadSide of ["N","E","S","W"] as RoadSide[]){
  const {plans}=generateRoadPlans({...base,roadSide});
  assert.equal(plans.length,2);
  const projection=siteProjection(18,50,roadSide);
  for(const p of plans){
   const parking=p.rooms.find(r=>r.id==="parking")!;
   const physical=projectRect(parking,18,50,roadSide);
   assert.ok(physical.w*physical.d>=128);
   const gates=[p.gate,p.pedestrianGate];
   for(const gate of gates){
    const physicalGate=projectPoint({x:gate.xFt,y:0},18,50,roadSide);
    if(projection.roadEdge==="top")assert.equal(physicalGate.y,0);
    if(projection.roadEdge==="right")assert.equal(physicalGate.x,projection.widthFt);
    if(projection.roadEdge==="bottom")assert.equal(physicalGate.y,projection.depthFt);
    if(projection.roadEdge==="left")assert.equal(physicalGate.x,0);
   }
  }
 }
});
test("projection rejects invalid site dimensions",()=>assert.throws(()=>siteProjection(0,50,"N"),RangeError));
