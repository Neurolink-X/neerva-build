import test from "node:test";
import assert from "node:assert/strict";
import {generateSpatialPortfolio,validateRequestedProgramme,portfolioForPlanId} from "./road-generator.ts";
import {planSiteReview,validatePlan,type PlanBrief} from "./plan-model.ts";
import {architectureTopology} from "./architecture-profile.ts";
const b:PlanBrief={widthFt:15,depthFt:30,roadSide:"N",floors:1,bedrooms:1,parking:false,setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("compact portfolios include three actual programmes and preserve prior saved identities",()=>{
 const r=generateSpatialPortfolio(b),old=generateSpatialPortfolio(b,24,true);
 assert.ok(r.plans.some(p=>p.id.endsWith("-front-service-v1")));
 assert.ok(r.plans.some(p=>p.id.endsWith("-private-front-v1")));
 assert.ok(new Set(r.plans.map(architectureTopology)).size>=3);
 for(const p of r.plans)assert.deepEqual(validateRequestedProgramme(p,b),[]);
 for(const p of old.plans)assert.ok(portfolioForPlanId(b,p.id).plans.some(x=>x.id===p.id));
});
test("site review separates geometric openings from legal clearance and bathroom exhaust",()=>{
 const p=generateSpatialPortfolio(b,1).plans[0];assert.ok(p);
 const review=planSiteReview(p);assert.ok(review.habitableCount>=3);assert.ok(review.ventilationReview.length>0);assert.ok(review.bathroomExhaust>0);assert.match(review.parking,/No car bay/);
 assert.deepEqual(validatePlan(p),[]);
});
test("pedestrian wide homes can use street frontage for a private bedroom rather than a redundant car reserve",()=>{
 const brief:PlanBrief={...b,widthFt:40,depthFt:60,floors:2,bedrooms:6};
 const r=generateSpatialPortfolio(brief);assert.ok(r.plans.length===24);
 assert.ok(r.plans.some(p=>p.id.endsWith("-private-front-v1")&&p.rooms.some(x=>x.kind==="bedroom"&&x.floor===0&&Math.abs(x.y-p.setbacks.frontFt)<.01)));
 for(const p of r.plans){assert.deepEqual(validateRequestedProgramme(p,brief),[]);assert.equal(p.gate.widthFt,0);}
});
