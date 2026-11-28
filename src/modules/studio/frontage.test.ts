import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio} from "./road-generator.ts";
import {frontagePanels,frontageOpenings,facadeAccents,frontageSignature} from "./frontage.ts";
import {type PlanBrief} from "./plan-model.ts";
const brief:PlanBrief={widthFt:40,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("frontage is based on actual visible geometry, not paint or room names",()=>{
 const result=generateSpatialPortfolio(brief);
 assert.ok(result.plans.length>1);
 assert.ok(new Set(result.plans.map(frontageSignature)).size>1,"different street geometries required");
 for(const p of result.plans){
  const panels=frontagePanels(p);assert.ok(panels.length);
  assert.equal(frontageSignature({...p,facade:{...p.facade,main:"#ffffff"}}),frontageSignature(p));
  for(const a of panels){
   const room=p.rooms.find(r=>r.id===a.roomId);assert.ok(room);assert.equal(a.y,room.y);assert.equal(a.floor,room.floor);
   assert.ok(a.x>=room.x-1e-5&&a.x+a.w<=room.x+room.w+1e-5);
   for(const b of panels.filter(q=>q!==a&&q.floor===a.floor))assert.ok(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)<1e-5);
  }
  for(const {o,r,a,w} of frontageOpenings(p,panels)){
   assert.equal(o.side,"front");assert.ok(w>0&&a>=r.x+o.atFt-1e-5&&a+w<=r.x+o.atFt+o.widthFt+1e-5);
  }
  for(const kit of ["simple-parapet","stepped-band","jali-screen","cladding-band","pergola","cantilever"] as const){
   for(const a of facadeAccents({...p,facade:{...p.facade,kit}},panels)){
    assert.ok(a.w>0&&a.h>0&&a.d>0&&a.d<=.12);
    const support=panels.find(q=>q.floor===a.floor&&a.x>=q.x-1e-5&&a.x+a.w<=q.x+q.w+1e-5);assert.ok(support);
    for(const {o,r,a:x,w} of frontageOpenings(p,panels).filter(q=>q.r.id===support.roomId)){
     const overlapX=Math.min(a.x+a.w,x+w)-Math.max(a.x,x);
     const base=r.floor*p.walls.heightFt+o.sillFt;
     const overlapY=Math.min(a.y+a.h,base+o.heightFt)-Math.max(a.y,base);
     assert.ok(overlapX<1e-5||overlapY<1e-5,"finish must not block an opening");
    }
   }
  }
 }
});

test("residential finish kits are deterministic without creating extra floor plans",()=>{const a=generateSpatialPortfolio(brief,24).plans,b=generateSpatialPortfolio(brief,24).plans;assert.ok(a.length>1);assert.deepEqual(a.map(p=>[p.id,p.facade.kit]),b.map(p=>[p.id,p.facade.kit]));assert.ok(new Set(a.map(p=>p.facade.kit)).size>1);});
