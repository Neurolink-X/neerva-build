import test from "node:test";
import assert from "node:assert/strict";
import {roadPoint,roadRect,roadSegment,siteDimensions,threeRoadRotation} from "./plan-coordinate.ts";
import type {RoadSide} from "./plan-model.ts";
test("road edge, pedestrian gate and 8x16 bay transform together for all four road directions",()=>{
 const w=18,d=50;
 for(const side of ["N","E","S","W"] as RoadSide[]){
  const dims=siteDimensions(w,d,side),front=roadSegment(w,d,side);
  const parking=roadRect({x:0,y:0,w:9,d:16},w,d,side);
  const pedestrian=roadPoint({x:12,y:0},w,d,side);
  assert.ok(parking.w*parking.d===144,side);
  if(side==="N"){assert.equal(front.start.y,0);assert.equal(parking.y,0);assert.equal(pedestrian.y,0);}
  if(side==="E"){assert.equal(front.start.x,d);assert.equal(parking.x+parking.w,d);assert.equal(pedestrian.x,d);}
  if(side==="S"){assert.equal(front.start.y,d);assert.equal(parking.y+parking.d,d);assert.equal(pedestrian.y,d);}
  if(side==="W"){assert.equal(front.start.x,0);assert.equal(parking.x,0);assert.equal(pedestrian.x,0);}
  assert.ok(parking.x>=0&&parking.y>=0);
  assert.ok(parking.x+parking.w<=dims.w&&parking.y+parking.d<=dims.d);
  assert.ok(Number.isFinite(threeRoadRotation(side)));
 }
});
test("road projection preserves area and pairwise room separation",()=>{
 const a={x:0,y:16,w:5.5,d:10},b={x:5.5,y:16,w:12.5,d:10};
 for(const side of ["N","E","S","W"] as RoadSide[]){
  const ra=roadRect(a,18,50,side),rb=roadRect(b,18,50,side);
  assert.equal(ra.w*ra.d,55);
  assert.equal(rb.w*rb.d,125);
  const overlap=Math.max(0,Math.min(ra.x+ra.w,rb.x+rb.w)-Math.max(ra.x,rb.x))*Math.max(0,Math.min(ra.y+ra.d,rb.y+rb.d)-Math.max(ra.y,rb.y));
  assert.equal(overlap,0,side);
 }
});
