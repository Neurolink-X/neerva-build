import test from "node:test";
import assert from "node:assert/strict";
import {roadPoint,roadRect,roadSegment,siteDimensions} from "./plan-coordinate.ts";
import {generateRoadPlans} from "./road-generator.ts";
import type {PlanBrief,RoadSide} from "./plan-model.ts";
const base:PlanBrief={widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("shared compass projection maps road entry and parking to the same physical edge in all directions",()=>{
 for(const side of ["N","E","S","W"] as RoadSide[]){
  const v=siteDimensions(18,50,side);
  const edge=roadSegment(18,50,side);
  assert.equal(Math.hypot(edge.end.x-edge.start.x,edge.end.y-edge.start.y),18);
  const parking=roadRect({x:0,y:0,w:8.5,d:16},18,50,side);
  assert.ok(parking.x>=0&&parking.y>=0&&parking.x+parking.w<=v.w&&parking.y+parking.d<=v.d);
  assert.equal(parking.w*parking.d,136);
  const {plans}=generateRoadPlans({...base,roadSide:side});
  assert.equal(plans.length,2,side);
  for(const plan of plans){
   const area=roadRect(plan.rooms.find(r=>r.id==="parking")!,18,50,side);
   assert.ok(area.w*area.d>=128);
   for(const gate of [plan.gate,plan.pedestrianGate]){
    const p=roadPoint({x:gate.xFt,y:0},18,50,side);
    if(side==="N")assert.equal(p.y,0);
    if(side==="E")assert.equal(p.x,v.w);
    if(side==="S")assert.equal(p.y,v.d);
    if(side==="W")assert.equal(p.x,0);
   }
  }
 }
});
test("projection dimensions reject zero, negative and nonfinite geometry",()=>{
 for(const [w,d] of [[0,50],[-18,50],[18,0],[18,Infinity],[NaN,50]])
  assert.throws(()=>siteDimensions(w,d,"N"),RangeError);
});
