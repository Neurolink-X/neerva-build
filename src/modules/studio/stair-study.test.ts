import test from "node:test";
import assert from "node:assert/strict";
import {straightStairStudy,residentialStairStudies,dogLegStairStudy,stairFloorPatches} from "./stair-study.ts";
import {generateSpatialPortfolio,generateStairReadyPortfolio,portfolioForPlanId} from "./road-generator.ts";
import {overlapArea,area,type Room,type Opening} from "./plan-model.ts";
const lower:Room={id:"s0",label:"Stair",kind:"stairs",floor:0,x:2,y:4,w:5,d:24,minClearWidthFt:3.25};
const upper={...lower,id:"s1",floor:1};
const doors:Opening[]=[{id:"a",roomId:"s0",side:"front",atFt:1,widthFt:3,sillFt:0,heightFt:7,kind:"door",connectsTo:"hall0"},{id:"b",roomId:"s1",side:"rear",atFt:1,widthFt:3,sillFt:0,heightFt:7,kind:"door",connectsTo:"hall1"}];
test("straight flight connects measured lower and upper landings and stays inside the bay",()=>{
 const study=straightStairStudy(lower,upper,9.5,doors);assert.ok(study);
 assert.equal(study.steps.length,15);
 assert.ok(study.riseFt<=7.5/12);
 assert.equal(study.landings[1].topFt,9.5);
 for(const r of [...study.steps,...study.landings])assert.ok(Math.abs(overlapArea(lower,r)-area(r))<1e-6);
 for(let i=1;i<study.steps.length;i++)assert.ok(study.steps[i].topFt>study.steps[i-1].topFt);
});
test("reject tiny, shifted or inaccessible stair bays rather than invent floating treads",()=>{
 assert.equal(straightStairStudy({...lower,d:10},{...upper,d:10},9.5,doors),null);
 assert.equal(straightStairStudy(lower,{...upper,x:3},9.5,doors),null);
 assert.equal(straightStairStudy(lower,upper,9.5,[doors[0]]),null);
 assert.equal(straightStairStudy(lower,upper,9.5,[doors[0],{...doors[1],side:"right"}]),null);
});
test("generated home alternatives account for every lower-floor stair reserve",()=>{
 const result=generateSpatialPortfolio({widthFt:40,depthFt:50,floors:2,bedrooms:3,parking:true,roadSide:"N",setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}},12);
 assert.ok(result.plans.length);
 for(const plan of result.plans){const review=residentialStairStudies(plan);assert.equal(review.unresolved.length+review.studies.length,plan.rooms.filter(r=>r.kind==="stairs"&&r.floor<plan.floors-1).length);}
});

test("dog-leg flight uses distinct aligned entry and exit doors with a real turn platform",()=>{
 const a={...lower,w:8,d:14},b={...upper,w:8,d:14};
 const ds=[{...doors[0],atFt:.5},{...doors[1],side:"front" as const,atFt:3.75}];
 const study=dogLegStairStudy(a,b,9.5,ds);assert.ok(study);assert.equal(study.kind,"dog-leg");
 assert.equal(study.steps.length,14);assert.equal(study.landings.length,3);
 assert.equal(study.landings[2].topFt,9.5);
 const all=[...study.steps,...study.landings];
 for(const r of all)assert.ok(Math.abs(overlapArea(a,r)-area(r))<1e-6);
 for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)assert.ok(overlapArea(all[i],all[j])<1e-6);
 assert.equal(stairFloorPatches(b,[study]).length,1);
 assert.ok(area(stairFloorPatches(b,[study])[0])<area(b));
 assert.equal(dogLegStairStudy({...a,w:5},{...b,w:5},9.5,ds),null);
 assert.equal(dogLegStairStudy(a,b,9.5,[ds[0],{...ds[1],atFt:.5}]),null);
});

test("actual wide G+1 house concepts offer checked dog-leg stair variants without changing the old portfolio",()=>{
 const brief={widthFt:40,depthFt:50,floors:2 as const,bedrooms:3,parking:true,roadSide:"N" as const,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
 const before=generateSpatialPortfolio(brief,24);const ready=generateStairReadyPortfolio(brief,24);
 assert.ok(ready.plans.length,"wide house must offer real dog-leg geometry");
 for(const p of ready.plans){assert.equal(residentialStairStudies(p).unresolved.length,0);assert.equal(residentialStairStudies(p).studies[0].kind,"dog-leg");assert.equal(portfolioForPlanId(brief,p.id).plans.find(v=>v.id===p.id)?.id,p.id);}
 assert.deepEqual(generateSpatialPortfolio(brief,24),before);
});
