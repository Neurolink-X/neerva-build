import test from "node:test";
import assert from "node:assert/strict";
import {buildingPurposes,purposeDetails,buildingInputRequirements,buildingStarter,validateBuildingBrief,generateBuildingConcepts,validateBuildingConcept,type BuildingBrief} from "./building-purpose.ts";
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
