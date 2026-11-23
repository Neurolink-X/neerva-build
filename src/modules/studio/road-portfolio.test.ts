import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio} from "./road-generator.ts";
import {validatePlan,type PlanBrief} from "./plan-model.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {roadPoint,oppositeRoadSide} from "./plan-coordinate.ts";
const standard:PlanBrief={widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,
 setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
function geometrySignature(p:ReturnType<typeof generateSpatialPortfolio>["plans"][number]){
 return p.rooms.map(r=>[r.floor,r.kind,r.x,r.y,r.w,r.d].join(":")).sort().join("|");
}
test("exact 18x50 road-first 3BHK has 24 genuinely distinct room programs/partitions",()=>{
 const {plans,blockers}=generateSpatialPortfolio(standard,24);
 assert.deepEqual(blockers,[],blockers.join("\n"));
 assert.equal(plans.length,24,`only ${plans.length} distinct, checked options`);
 assert.equal(new Set(plans.map(geometrySignature)).size,24);
 assert.equal(new Set(plans.map(p=>p.id)).size,24);
 // Room USE/PROGRAMME must differ for all 24, not just wall lengths, colours or labels.
 // 4 rear-space kinds x 3 actual hall-space kinds x 2 car entry positions = 24.
 const semantic=plans.map(p=>[
  p.rooms.find(r=>r.id==="dining")?.kind,
  p.rooms.find(r=>r.id==="utility-g")?.kind,
  p.variant
 ].join("/"));
 assert.equal(new Set(semantic).size,24,"each plan must have a distinct hall/rear-space/parking programme");
 assert.equal(plans.filter(p=>p.variant==="parking-left").length,12);
 assert.equal(plans.filter(p=>p.variant==="parking-right").length,12);
 assert.ok(plans.some(p=>p.rooms.some(r=>r.kind==="terrace"&&r.floor===0)),"at least one accessible rear courtyard");
 assert.ok(plans.some(p=>p.rooms.some(r=>r.kind==="lounge"&&r.floor===0)),"at least one covered family gallery");
 assert.ok(plans.some(p=>p.rooms.some(r=>r.kind==="utility"&&r.floor===0)),"at least one practical wash");
 assert.ok(plans.some(p=>p.rooms.filter(r=>r.floor===0&&r.kind==="living").length>1),"family hall option");
 for(const p of plans){
  assert.deepEqual(validatePlan(p),[],p.id);
  assert.equal(p.plot.widthFt,18);assert.equal(p.plot.depthFt,50);
  assert.equal(p.rooms.filter(r=>r.kind==="bedroom").length,3);
  assert.equal(p.parking?.clearDepthFt,16);
  assert.equal(p.rooms.find(r=>r.id==="verandah")?.y,0);
  assert.equal(p.rooms.find(r=>r.id==="parking")?.y,0);
  const design=studioDesignFromPlan(p);
  assert.deepEqual(
   design.layout.rooms.map(r=>[r.id,r.xFt,r.yFt,r.wFt,r.dFt,r.floorIndex]),
   p.rooms.map(r=>[r.id,r.x,r.y,r.w,r.d,r.floor]),
   "2D and 3D room coordinates must be identical"
  );
  assert.equal(design.plot.widthFt,p.plot.widthFt);
  assert.equal(design.plot.depthFt,p.plot.depthFt);
 }
});
test("changing plot dimensions and road side recomputes models, doors, car entry and fingerprints",()=>{
 for(const side of ["N","E","S","W"] as const){
  const cases=[{...standard,roadSide:side},{...standard,widthFt:22,depthFt:55,roadSide:side}];
  const a=generateSpatialPortfolio(cases[0],24),b=generateSpatialPortfolio(cases[1],24);
  assert.ok(a.plans.length>0);assert.ok(b.plans.length>0);
  assert.notEqual(a.plans[0].id,b.plans[0].id);
  for(const set of [a,b])for(const p of set.plans){
   assert.deepEqual(validatePlan(p),[],p.id);
   assert.equal(p.plot.roadSide,side);
   const left=roadPoint({x:p.gate.xFt,y:0},p.plot.widthFt,p.plot.depthFt,side);
   const right=roadPoint({x:p.gate.xFt+p.gate.widthFt,y:0},p.plot.widthFt,p.plot.depthFt,side);
   if(side==="N"||side==="S")assert.equal(left.y,right.y);
   else assert.equal(left.x,right.x);
  }
  assert.equal(oppositeRoadSide(oppositeRoadSide(side)),side);
 }
});
test("impossible plot constraints never produce duplicate fake plans",()=>{
 for(const input of [{...standard,widthFt:15,depthFt:30},{...standard,parking:false},
  {...standard,setbacks:{frontFt:8,rearFt:7,leftFt:3,rightFt:3}}]){
  const generated=generateSpatialPortfolio(input);
  assert.equal(generated.plans.length,0);
  assert.ok(generated.blockers.length>0);
 }
});

test("compact and three-level plots keep precise dimensions across drawings and meshes",()=>{
 for(const brief of [{...standard,widthFt:20,depthFt:40,bedrooms:2},
  {...standard,widthFt:30,depthFt:40},{...standard,widthFt:40,depthFt:60},
  {...standard,widthFt:21.25,depthFt:51.75,floors:3 as const}]){
  const preview=generateSpatialPortfolio(brief,1).plans[0];
  assert.ok(preview);
  assert.equal(preview.id,generateSpatialPortfolio(brief,24).plans[0].id);
  assert.deepEqual(validatePlan(preview),[]);
  const design=studioDesignFromPlan(preview);
  assert.equal(design.plot.widthFt,brief.widthFt);
  assert.equal(design.plot.depthFt,brief.depthFt);
  assert.equal(design.bedrooms,brief.bedrooms);
  assert.equal(new Set(design.layout.rooms.map(r=>r.floorIndex)).size,brief.floors);
  assert.deepEqual(design.layout.rooms.map(r=>[r.id,r.floorIndex,r.xFt,r.yFt,r.wFt,r.dFt]),
   preview.rooms.map(r=>[r.id,r.floor,r.x,r.y,r.w,r.d]));
 }
});

test("20 by 40 ft ground-floor request fits two independently accessible bedrooms and road parking",()=>{
 const plan=generateSpatialPortfolio({...standard,widthFt:20,depthFt:40,bedrooms:2,floors:1},1).plans[0];
 assert.ok(plan);
 assert.deepEqual(validatePlan(plan),[]);
 assert.equal(plan.rooms.filter(r=>r.kind==="bedroom"&&r.floor===0).length,2);
 assert.equal(plan.parking?.clearDepthFt,16);
});

test("different option indices lead to different PlanModel room geometry, all floor levels are explicit",()=>{
 const variants=generateSpatialPortfolio(standard,24).plans;
 assert.equal(variants.length,24);
 const first=variants[0],sixth=variants[5];
 assert.notEqual(first.id,sixth.id);
 assert.notEqual(geometrySignature(first),geometrySignature(sixth));
 assert.deepEqual(new Set(first.rooms.map(r=>r.floor)),new Set([0,1]));
 const ground=generateSpatialPortfolio({...standard,widthFt:20,depthFt:40,bedrooms:2,floors:1},24).plans;
 assert.ok(ground.length>0);
 assert.ok(ground.every(p=>p.floors===1&&p.rooms.every(r=>r.floor===0)));
});
