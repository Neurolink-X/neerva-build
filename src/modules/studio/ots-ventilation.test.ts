import test from "node:test";
import assert from "node:assert/strict";
import {isOtsRoom,overlapArea,validatePlan,type PlanBrief,type PlanModel} from "./plan-model.ts";
import {generateSpatialPortfolio,generateCoveredUpperPortfolio,portfolioForPlanId,validateRequestedProgramme} from "./road-generator.ts";
import {otsVariant,otsGrilleBars,otsGrilleLevel,airOptimizedPlan} from "./ots-ventilation.ts";
import {exposedRoofPatches} from "./plan-surfaces.ts";
import {windowExposure} from "./ventilation.ts";
const brief:PlanBrief={widthFt:30,depthFt:60,roadSide:"N",floors:2,bedrooms:4,parking:true,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("shaft alternatives preserve exact programme, no solid roof and deterministic restoration",()=>{
 let found=0;
 for(const b of [brief,{...brief,widthFt:18,depthFt:50,bedrooms:3},{...brief,widthFt:15,depthFt:30,bedrooms:1,parking:false,floors:1 as const},{...brief,widthFt:10.5,depthFt:30,bedrooms:1,parking:false,floors:1 as const}]){
  const r=generateSpatialPortfolio(b);assert.ok(r.plans.length);
  for(const p of r.plans.slice(0,8)){
   const q=otsVariant(p);if(q===p)continue;found++;
   const shafts=q.rooms.filter(isOtsRoom),s=shafts[0];
   assert.equal(shafts.length,q.floors);assert.deepEqual(validateRequestedProgramme(q,b),[]);
   assert.ok(shafts.every(r=>r.x===s.x&&r.y===s.y&&r.w===s.w&&r.d===s.d));
   assert.ok(exposedRoofPatches(q).every(r=>overlapArea(r,s)<1e-5));
   const bars=otsGrilleBars(q);assert.ok(bars.length>6);assert.ok(bars.every(r=>overlapArea(r,s)>0));
   assert.ok(q.openings.some(o=>o.id.startsWith("ots-v1-window-")));
   assert.deepEqual(otsVariant(q),q);
   assert.ok(portfolioForPlanId(b,q.id).plans.some(x=>x.id===q.id));
   const combined=airOptimizedPlan(p,true,true);assert.deepEqual(validatePlan(combined),[]);
   assert.ok(portfolioForPlanId(b,combined.id).plans.some(x=>x.id===combined.id));
  }
 }
 console.log("ots-valid-variants "+found);
 assert.ok(found>0,"At least one real OTS geometry must be feasible");
});
test("rejects a missing or moved upper shaft floor",()=>{
 const p=generateSpatialPortfolio(brief).plans[0];assert.ok(p);
 const q:PlanModel={...p,rooms:[...p.rooms,{id:"ots-v1-floor-0",kind:"terrace",label:"OTS",floor:0,x:0,y:0,w:3,d:3,minClearWidthFt:3}]};
 assert.ok(validatePlan(q).some(e=>e.includes("OTS reserve")));
});

test("attached-house roof-jaal alternatives never create a solid roof over the shaft or pretend an infeasible shaft exists",()=>{const b={...brief,widthFt:18,depthFt:50,bedrooms:3};for(const p of generateSpatialPortfolio(b,8).plans){const q=airOptimizedPlan(p,true,true);assert.deepEqual(validateRequestedProgramme(q,b),[]);const shafts=q.rooms.filter(isOtsRoom);if(!shafts.length){assert.equal(otsGrilleBars(q).length,0);continue;}assert.equal(shafts.length,q.floors);assert.ok(shafts.every(s=>exposedRoofPatches(q).every(r=>overlapArea(r,s)<1e-5)));assert.ok(otsGrilleBars(q).length>0);}});

test("attached-house matrix covers 1–6 BHK, three levels, irregular plots and all road directions",()=>{
 const cases:Omit<PlanBrief,"roadSide">[]=[
 {widthFt:15,depthFt:30,floors:1,bedrooms:1,parking:false,setbacks:brief.setbacks},
 {widthFt:20,depthFt:40,floors:1,bedrooms:2,parking:false,setbacks:brief.setbacks},
 {widthFt:18,depthFt:50,floors:2,bedrooms:3,parking:true,setbacks:brief.setbacks},
 {widthFt:30,depthFt:60,floors:2,bedrooms:4,parking:true,setbacks:brief.setbacks},
 {widthFt:40,depthFt:70,floors:3,bedrooms:5,parking:true,setbacks:brief.setbacks,siteShape:{kind:"rear-left-notch",notchWidthFt:5,notchDepthFt:10}},
 {widthFt:40,depthFt:60,floors:3,bedrooms:6,parking:true,setbacks:brief.setbacks}
 ];
 let modeled=0,unavailable=0,blocked=0,checked=0;
 for(const input of cases)for(const roadSide of ["N","E","S","W"] as const){
  const b:PlanBrief={...input,roadSide},portfolio=generateSpatialPortfolio(b,2);
  if(!portfolio.plans.length){assert.ok(portfolio.blockers.length);blocked++;continue;}
  for(const p of portfolio.plans){
   checked++;const q=airOptimizedPlan(p,true,true);
   const remaining=new Set(q.openings.map(o=>o.id));for(const o of p.openings.filter(o=>!remaining.has(o.id))){assert.equal(o.kind,"window");assert.equal(o.connectsTo,undefined);const old=p.rooms.find(r=>r.id===o.roomId)!;assert.equal(windowExposure(p,old,o),"review");}
   assert.deepEqual(validatePlan(q),[],q.id);assert.deepEqual(validateRequestedProgramme(q,b),[],q.id);
   const shafts=q.rooms.filter(isOtsRoom);
   if(!shafts.length){unavailable++;assert.equal(otsGrilleBars(q).length,0);continue;}
   modeled++;assert.equal(shafts.length,q.floors);
   assert.ok(shafts.every(s=>exposedRoofPatches(q).every(r=>overlapArea(r,s)<1e-5)));
   assert.ok(otsGrilleBars(q).length>0);assert.ok(q.openings.some(o=>o.id.startsWith("ots-v1-window-")));
  }
 }
 assert.ok(checked>0);assert.equal(modeled+unavailable,checked);
 console.log("attached-house-matrix "+JSON.stringify({briefs:cases.length*4,checked,modeled,unavailable,blocked}));
});

 test("exact attached 18x50 G+1 3BHK portfolio includes a usable roof-jaal option",()=>{const b={...brief,widthFt:18,depthFt:50,bedrooms:3};const plans=generateSpatialPortfolio(b).plans;let q:PlanModel|undefined;for(const p of plans){const candidate=airOptimizedPlan(p,true,true);if(candidate.rooms.some(isOtsRoom)){q=candidate;break;}}assert.ok(q,"at least one feasible aligned shaft is required for this benchmark");assert.deepEqual(validateRequestedProgramme(q,b),[]);assert.ok(otsGrilleBars(q).length>0);assert.ok(q.openings.some(o=>o.id.startsWith("ots-v1-window-")&&windowExposure(q!,q!.rooms.find(r=>r.id===o.roomId)!,o)==="ots"));});

test("roof grille uses the adjacent terrace level instead of floating at full roof height",()=>{
 const p=generateSpatialPortfolio({...brief,widthFt:18,depthFt:50,bedrooms:3},1).plans[0];assert.ok(p);
 assert.equal(otsGrilleLevel({...p,rooms:[]}),null);
 const shaft={id:"ots-v1-floor-1",label:"OTS",kind:"terrace" as const,floor:1,x:0,y:0,w:3,d:3,minClearWidthFt:3};
 const terrace={...shaft,id:"rear-terrace",x:3,w:6};
 const fixture={...p,rooms:[shaft,terrace]};
 assert.equal(otsGrilleLevel(fixture),1);
 assert.equal(otsGrilleLevel({...fixture,rooms:[shaft]}),2);
 assert.ok(otsGrilleBars(fixture).length>0);
 assert.equal(airOptimizedPlan(p,false,false),p);
 assert.equal(airOptimizedPlan(p,true,true),airOptimizedPlan(p,true,true));
});

test("18x50 G+1 3BHK includes covered family space with compact terrace and restorable ID",()=>{
 const b={...brief,widthFt:18,depthFt:50,bedrooms:3};
 const variants=generateCoveredUpperPortfolio(b);
 assert.ok(variants.length>0);
 for(const p of variants){
  assert.deepEqual(validateRequestedProgramme(p,b),[]);
  assert.equal(p.rooms.filter(r=>r.kind==="bedroom").length,3);
  assert.ok(p.rooms.some(r=>r.kind==="lounge"&&r.id.startsWith("rear-family-")&&r.floor===1));
  assert.ok(p.rooms.filter(r=>r.floor===1&&r.kind==="terrace").every(r=>r.d<=5));
  assert.ok(portfolioForPlanId(b,p.id).plans.some(q=>q.id===p.id));
 }
});
