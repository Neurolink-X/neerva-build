import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio,portfolioForPlanId} from "./road-generator.ts";
import {entranceArrangement,architectureTopology} from "./architecture-profile.ts";
import {validatePlan,type PlanBrief} from "./plan-model.ts";
import {studioDesignFromPlan} from "./plan-model-adapter.ts";
import {buildingWallCells} from "./geometry.ts";
import {roadPoint,oppositeRoadSide} from "./plan-coordinate.ts";
const standard:PlanBrief={widthFt:18,depthFt:50,roadSide:"N",floors:2,bedrooms:3,parking:true,
 setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
function geometrySignature(p:ReturnType<typeof generateSpatialPortfolio>["plans"][number]){
 return p.rooms.map(r=>[r.floor,r.kind,r.x,r.y,r.w,r.d].join(":")).sort().join("|");
}
function meshSignature(p:ReturnType<typeof generateSpatialPortfolio>["plans"][number],floor?:number){
 return buildingWallCells(studioDesignFromPlan(p))
  .filter(c=>floor===undefined||c.floorIndex===floor)
  .map(c=>[c.floorIndex,c.axis,c.planeFt,c.startFt,c.endFt,c.bottomFt,c.topFt].join(":")).sort().join("|");
}
test("exact 18x50 road-first 3BHK has 24 genuinely distinct room programs/partitions",()=>{
 const {plans,blockers}=generateSpatialPortfolio(standard,24);
 assert.deepEqual(blockers,[],blockers.join("\n"));
 assert.equal(plans.length,24,`only ${plans.length} distinct, checked options`);
 assert.equal(new Set(plans.map(geometrySignature)).size,24);
 assert.equal(new Set(plans.map(p=>p.id)).size,24);
 // Distinct architecture must be more than a renamed, recoloured or mirrored ID.
 // The front-stair family moves the stair shaft physically beside the car bay.
 const frontStairs=plans.filter(p=>p.rooms.find(r=>r.id==="stairs-g")?.y===0);
 assert.ok(frontStairs.length>=2,"18x50 needs actual front-stair alternatives, not just new labels");
 assert.ok(plans.some(p=>p.rooms.find(r=>r.id==="stairs-g")?.y!==(p.setbacks.frontFt)),"retain conventional central-stair alternatives");
 assert.equal(new Set(plans.map(p=>meshSignature(p))).size,24,"all 24 must create different 3D walls");
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
 for(const input of [{...standard,widthFt:15,depthFt:30},{...standard,parking:false,widthFt:12,depthFt:26},
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


test("pedestrian plans retain requested bedrooms, floor geometry and independent entry",()=>{
 for(const [w,d,f,b,count] of [[15,30,1,1,6],[16,35,1,1,6],[18,50,1,1,10],[18,50,2,3,24],[30,50,3,3,24]] as const){
  const {plans}=generateSpatialPortfolio({...standard,widthFt:w,depthFt:d,floors:f,bedrooms:b,parking:false});
  if(w===16&&d===35)assert.ok(plans.length>=count&&plans.length<=24,"retain feasible compact alternatives, permit validated expansion");else assert.equal(plans.length,count);
  assert.equal(new Set(plans.map(geometrySignature)).size,plans.length,"compact and no-parking options must have distinct actual rooms");
  assert.equal(new Set(plans.map(p=>meshSignature(p))).size,plans.length,"compact and no-parking 3D walls must be different");
  for(const p of plans){
   assert.deepEqual(validatePlan(p),[]);assert.equal(p.parking,null);assert.equal(p.gate.widthFt,0);
   assert.equal(p.rooms.some(r=>r.kind==="parking"),false);
   assert.equal(studioDesignFromPlan(p).bedrooms,b);
  }
 }
});

test("portfolio uses the requested site envelope across nine plot sizes and every road side",()=>{
 for(const [w,d,f,b] of [[18,50,2,3],[20,40,1,2],[20,45,2,3],[20,50,2,3],[25,40,2,3],[25,50,2,3],[30,40,2,3],[30,50,3,3],[40,60,2,3]] as const){
  for(const side of ["N","S","E","W"] as const){
   const {plans}=generateSpatialPortfolio({...standard,widthFt:w,depthFt:d,floors:f,bedrooms:b,roadSide:side});
   assert.ok(plans.length>=2&&plans.length<=24,`${w}x${d}/${side}: no distinct supported alternatives`);
   assert.equal(new Set(plans.map(p=>p.id)).size,plans.length,`${w}x${d}/${side}: duplicate IDs`);
   assert.equal(new Set(plans.map(geometrySignature)).size,plans.length,`${w}x${d}/${side}: duplicate 2D room layouts`);
   assert.equal(new Set(plans.map(p=>meshSignature(p))).size,plans.length,`${w}x${d}/${side}: duplicate 3D walls`);
   for(const p of plans){
    assert.deepEqual(validatePlan(p),[]);
    const model=studioDesignFromPlan(p);
    assert.equal(model.bedrooms,b);assert.equal(model.floors,f);
    assert.deepEqual([model.plot.widthFt,model.plot.depthFt],[w,d]);
    assert.deepEqual(model.layout.rooms.map(r=>[r.floorIndex,r.xFt,r.yFt,r.wFt,r.dFt]),p.rooms.map(r=>[r.floor,r.x,r.y,r.w,r.d]));
    for(let level=0;level<f;level++)assert.ok(meshSignature(p,level).length>0,`missing 3D walls on floor ${level+1} of ${p.id}`);
   }
  }
 }
});

test("three real front-zone architectures when usable width permits",()=>{
 const {plans}=generateSpatialPortfolio({...standard,widthFt:25,depthFt:50},24);
 assert.equal(plans.length,24);
 const stairFront=plans.filter(p=>p.rooms.find(r=>r.id==="stairs-g")?.y===p.setbacks.frontFt);
 const bedroomFront=plans.filter(p=>p.rooms.find(r=>r.id==="bed-g")?.y===p.setbacks.frontFt);
 const standardFront=plans.filter(p=>p.rooms.find(r=>r.id==="living")?.y===p.setbacks.frontFt+4.5);
 assert.ok(stairFront.length>=2,"front stair beside parking must exist");
 assert.ok(bedroomFront.length>=2,"independently accessible bedroom beside parking must exist");
 assert.ok(standardFront.length>=2,"veranda next to parking must remain selectable");
 for(const model of [...stairFront,...bedroomFront]){
  assert.deepEqual(validatePlan(model),[],model.id);
  const bedroomCount=model.rooms.filter(r=>r.kind==="bedroom").length;
  assert.equal(bedroomCount,standard.bedrooms,"do not invent extra BHK rooms");
  assert.deepEqual(studioDesignFromPlan(model).layout.rooms.map(r=>[r.floorIndex,r.xFt,r.yFt,r.wFt,r.dFt]),
   model.rooms.map(r=>[r.floor,r.x,r.y,r.w,r.d]));
 }
});


test("large 4–6 BHK requests preserve exact inputs and unique wall geometry",()=>{
 for(const bedrooms of [4,5,6]){
  const brief={...standard,widthFt:36,depthFt:65,floors:2 as const,bedrooms};
  const {plans,blockers}=generateSpatialPortfolio(brief,24);
  assert.equal(blockers.length,0,blockers.join(" / "));
  assert.equal(plans.length,24,"large plot should deliver all 24 distinct options");
  assert.equal(new Set(plans.map(p=>meshSignature(p))).size,plans.length);
  assert.equal(new Set(plans.map(geometrySignature)).size,plans.length);
  for(const p of plans){assert.deepEqual(validatePlan(p),[]);assert.equal(p.rooms.filter(r=>r.kind==="bedroom").length,bedrooms);assert.equal(p.floors,2);assert.equal(p.plot.widthFt,36);assert.equal(p.plot.depthFt,65);assert.equal(studioDesignFromPlan(p).bedrooms,bedrooms);}
 }
});
test("small plot never silently downgrades requested 6 BHK",()=>{
 const {plans,blockers}=generateSpatialPortfolio({...standard,widthFt:18,depthFt:30,bedrooms:6});
 assert.equal(plans.length,0);assert.ok(blockers.length);
});

test("front stair alternatives are discoverable early and saved legacy layouts remain resolvable",()=>{
 const {plans}=generateSpatialPortfolio(standard,24),legacy=generateSpatialPortfolio(standard,24,true).plans;
 assert.equal(plans.length,24);assert.ok(plans.slice(0,6).some(p=>entranceArrangement(p)==="front-stair"));
 assert.ok(new Set(plans.map(architectureTopology)).size>=2);
 for(const p of plans)assert.deepEqual(validatePlan(p),[]);
 for(const p of legacy){const restored=portfolioForPlanId(standard,p.id).plans.find(v=>v.id===p.id);assert.ok(restored,p.id);assert.equal(geometrySignature(restored),geometrySignature(p));}
});
