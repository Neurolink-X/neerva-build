import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio,planSignature,validateRequestedProgramme} from "./road-generator.ts";
import {type PlanBrief,planGeometryDigest,area,overlapArea} from "./plan-model.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {buildingWallCells,visibleWallCells,CUTAWAY_WALL_RATIO} from "./geometry.ts";
import {exposedRoofPatches,subtractRect} from "./plan-surfaces.ts";
import {roadRect,roadPoint,threeRoadRotation} from "./plan-coordinate.ts";
const base:PlanBrief={widthFt:40,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("every generated wide and compact plan matches its BHK brief and both renderer inputs",async()=>{
 for(const [widthFt,depthFt,bedrooms,floors] of [[15,30,1,1],[20,40,2,1],[40,50,2,2],[40,50,3,2],[36,65,4,2],[36,65,5,2],[36,65,6,2]] as const){
  for(const roadSide of ["N","E","S","W"] as const){
   const brief={...base,widthFt,depthFt,bedrooms,floors,roadSide,parking:widthFt!==15};
   const result=generateSpatialPortfolio(brief,24);
   assert.ok(result.plans.length>0,result.blockers.join(" / "));
   assert.equal(new Set(result.plans.map(planSignature)).size,result.plans.length);
   console.log("architecture-coverage "+JSON.stringify({kind:"residential",widthFt,depthFt,bedrooms,floors,roadSide,shown:result.plans.length}));
   assert.equal(new Set(result.plans.map(p=>p.id)).size,result.plans.length);
   const first=generateSpatialPortfolio(brief,1).plans[0];
   assert.ok(first);assert.equal(await planGeometryDigest(first),await planGeometryDigest(result.plans[0]),"fit preview must open the same first plan");
   for(const p of result.plans){
    assert.deepEqual(validateRequestedProgramme(p,brief),[],p.id);
    const d=studioDesignFromPlan(p);assert.equal(d.id,p.id);assert.equal(d.bedrooms,bedrooms);
    for(const r of p.rooms){
     const model=d.layout.rooms.find(m=>m.id===r.id);assert.ok(model);
     assert.deepEqual([model.xFt,model.yFt,model.wFt,model.dFt,model.floorIndex],[r.x,r.y,r.w,r.d,r.floor]);
     assert.deepEqual(model.openings,p.openings.filter(o=>o.roomId===r.id).map(o=>({kind:o.kind,wall:o.side,offsetFt:o.atFt,widthFt:o.widthFt,sillFt:o.sillFt,heightFt:o.heightFt})));
     const oriented=roadRect(r,widthFt,depthFt,roadSide);
     assert.ok(Math.abs(area(oriented)-area(r))<1e-5);
    }
    const mesh=buildingWallCells(d);
    for(let level=0;level<floors;level++){
     const cut=visibleWallCells(d,level,true);
     assert.ok(cut.length);assert.ok(cut.every(c=>c.floorIndex===level&&c.topFt>c.bottomFt&&c.topFt<=p.walls.heightFt*CUTAWAY_WALL_RATIO+1e-6));
     assert.deepEqual(visibleWallCells(d,level,false),mesh.filter(c=>c.floorIndex===level));
    }
    assert.deepEqual(visibleWallCells(d),mesh);
   }
  }
 }
});
test("compass orientation uses the same centered rotation in 2D and 3D",()=>{
 for(const side of ["N","E","S","W"] as const){
  const angle=threeRoadRotation(side),w=40,d=50,ow=side==="E"||side==="W"?d:w,od=side==="E"||side==="W"?w:d;
  for(const pt of [{x:0,y:0},{x:w,y:d},{x:7,y:11}]){
   const p=roadPoint(pt,w,d,side),x=pt.x-w/2,z=pt.y-d/2;
   assert.ok(Math.abs(p.x-ow/2-(x*Math.cos(angle)+z*Math.sin(angle)))<1e-6);
   assert.ok(Math.abs(p.y-od/2-(-x*Math.sin(angle)+z*Math.cos(angle)))<1e-6);
  }
 }
});
test("rectangular roof subtraction preserves exact area without duplicate overlapping patches",()=>{
 const source={x:0,y:0,w:10,d:10},cut={x:2,y:3,w:4,d:5};
 const parts=subtractRect(source,cut);
 assert.equal(parts.reduce((n,r)=>n+area(r),0),80);
 for(let i=0;i<parts.length;i++){
  assert.equal(overlapArea(parts[i],cut),0);
  for(let j=i+1;j<parts.length;j++)assert.equal(overlapArea(parts[i],parts[j]),0);
 }
 const plan=generateSpatialPortfolio(base,1).plans[0];assert.ok(plan);
 const roofs=exposedRoofPatches(plan);assert.ok(roofs.length);
 for(const patch of roofs){
  const room=plan.rooms.find(r=>r.id===patch.roomId);assert.ok(room);assert.equal(patch.floor,room.floor+1);
  assert.ok(Math.abs(overlapArea(patch,room)-area(patch))<1e-5);
  for(const above of plan.rooms.filter(r=>r.floor===patch.floor&&r.kind!=="parking"))assert.ok(overlapArea(patch,above)<1e-5);
 }
});

test("portfolio limits are bounded and invalid numeric limits do not suppress a valid residential brief",()=>{
 const brief={...base,widthFt:15,depthFt:30,bedrooms:1,floors:1,parking:false};
 const standard=generateSpatialPortfolio(brief,24);
 assert.ok(standard.plans.length>0);
 for(const limit of [NaN,Infinity,1000000])assert.deepEqual(generateSpatialPortfolio(brief,limit),standard);
 assert.equal(generateSpatialPortfolio(brief,0).plans.length,1);
});
