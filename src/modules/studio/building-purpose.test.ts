import test from "node:test";
import assert from "node:assert/strict";
import {buildingPurposes,buildingLayoutFamily,purposeDetails,buildingInputRequirements,buildingStarter,validateBuildingBrief,generateBuildingConcepts,validateBuildingConcept,type BuildingBrief} from "./building-purpose.ts";
const base:BuildingBrief={purpose:"mall",widthFt:180,depthFt:240,roadSide:"N",floors:3,unitsPerFloor:4,parkingBays:8,frontFt:40,rearFt:25,sideFt:10};
test("all supported purposes produce 24 unique feasible zoning concepts on a generous plot",()=>{
 for(const purpose of buildingPurposes)for(const roadSide of ["N","E","S","W"] as const){
  const brief={...base,purpose,roadSide},result=generateBuildingConcepts(brief);
  assert.equal(result.plans.length,24,purpose+" "+roadSide);
  assert.equal(new Set(result.plans.map(p=>p.signature)).size,24);
  const frontProfiles=new Set(result.plans.map(p=>JSON.stringify(p.zones.filter(z=>z.floor===0&&z.kind!=="parking"&&z.kind!=="open"&&z.kind!=="circulation").reduce((m,z)=>{const key=String(z.x);m[key]=Math.min(m[key]??Infinity,z.y);return m},{} as Record<string,number>))));
  assert.ok(frontProfiles.size>1,"different actual street-facing wing footprints required");
  assert.equal(generateBuildingConcepts(brief,1).plans[0]?.signature,result.plans[0].signature);
  for(const p of result.plans){
   assert.deepEqual(validateBuildingConcept(p),[]);
   assert.equal(p.zones.filter(z=>z.kind==="primary").length,brief.floors*brief.unitsPerFloor);
   assert.ok(p.zones.some(z=>z.label===purposeDetails[purpose].support[0]));
   assert.ok(p.conceptOnly);
  }
 }
});
test("impossible and malformed briefs return no substitute designs",()=>{
 for(const b of [{...base,widthFt:20},{...base,unitsPerFloor:24,depthFt:50},{...base,parkingBays:40},{...base,floors:0},{...base,widthFt:NaN}]){
  const result=generateBuildingConcepts(b);assert.equal(result.plans.length,0);assert.ok(result.blockers.length);
 }
});

test("each purpose has a feasible explicit starter and rejects insufficient usable space",()=>{
 for(const purpose of buildingPurposes){
  const b=buildingStarter(purpose),req=buildingInputRequirements(b);assert.ok(req);
  assert.deepEqual(validateBuildingBrief(b),[]);
  const result=generateBuildingConcepts(b);assert.ok(result.plans.length>0,purpose+" starter must fit");
  assert.equal(generateBuildingConcepts({...b,widthFt:req.minWidthFt-1}).plans.length,0);
  assert.equal(generateBuildingConcepts({...b,depthFt:req.minDepthFt-1}).plans.length,0);
  const before=JSON.stringify(b);generateBuildingConcepts(b);assert.equal(JSON.stringify(b),before);
  const dense={...b,unitsPerFloor:24};assert.ok(buildingInputRequirements(dense)!.minDepthFt>=req.minDepthFt);
  assert.ok(validateBuildingBrief({...b,sideFt:b.widthFt/2}).length);
 }
});

test("purpose-led family preserves exact brief and materially changes programme placement",()=>{
 for(const purpose of buildingPurposes){
  const b=buildingStarter(purpose),classic=generateBuildingConcepts(b,24),modern=generateBuildingConcepts(b,24,"purpose-led");
  assert.ok(modern.plans.length,purpose+" purpose-led starter");
  assert.equal(new Set(modern.plans.map(p=>p.signature)).size,modern.plans.length);
  assert.notEqual(modern.plans[0].signature,classic.plans[0].signature);
  assert.equal(buildingLayoutFamily(modern.plans[0].id),"purpose-led");
  assert.equal(buildingLayoutFamily(classic.plans[0].id),"classic");
  for(const p of modern.plans){
   assert.deepEqual(p.brief,b);assert.deepEqual(validateBuildingConcept(p),[]);
   if(purpose==="restaurant"||purpose==="shops")for(const f of Array.from({length:b.floors},(_,i)=>i)){
    const primary=p.zones.filter(z=>z.floor===f&&z.kind==="primary");assert.ok(primary.some(z=>z.y<=b.frontFt+Math.min(8,(b.depthFt-b.frontFt-b.rearFt)*.06)+1e-6));
   }
  }
  assert.equal(generateBuildingConcepts(b,1,"purpose-led").plans[0].signature,modern.plans[0].signature);
 }
});

test("single-loaded gallery creates real topology variation with same exact programme and legal-review boundary",()=>{
 for(const purpose of buildingPurposes){
  const b={...base,purpose,parkingBays:0};
  const result=generateBuildingConcepts(b,24,"side-gallery");assert.ok(result.plans.length,purpose+" gallery");
  assert.equal(new Set(result.plans.map(p=>p.signature)).size,result.plans.length);
  assert.equal(generateBuildingConcepts(b,1,"side-gallery").plans[0].signature,result.plans[0].signature);
  for(const plan of result.plans){
   assert.equal(buildingLayoutFamily(plan.id),"side-gallery");
   assert.deepEqual(plan.brief,b);assert.deepEqual(validateBuildingConcept(plan),[]);
   for(let floor=0;floor<b.floors;floor++){
    const zs=plan.zones.filter(z=>z.floor===floor),hall=zs.find(z=>z.kind==="circulation")!;
    const functional=zs.filter(z=>!["circulation","parking","open"].includes(z.kind));
    assert.ok(functional.every(z=>Math.abs(z.x+z.w-hall.x)<1e-6)||functional.every(z=>Math.abs(z.x-hall.x-hall.w)<1e-6));
   }
  }
 }
});
