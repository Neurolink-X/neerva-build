import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts} from "./building-purpose.ts";
import {recommendBuildingConcepts,visibleInteriorSignature} from "./building-recommendations.ts";
import {roadEnvelopeChoices,envelopeFits,parsePlot} from "./irregular-plot.ts";
import {commercialSaveSchema,rebuildCommercialSnapshot} from "./commercial-save.ts";
import {defaultFinishScheme} from "./finish-model.ts";
test("bounded summary shortlist regenerates the exact selected geometry",()=>{
 for(const purpose of ["mall","school","restaurant","shops","rental"] as const){
  const brief=buildingStarter(purpose),r=recommendBuildingConcepts(brief);
  assert.ok(r.options.length>0&&r.options.length<=24);assert.equal(new Set(r.options.map(o=>o.id)).size,r.options.length);
  assert.deepEqual(r,recommendBuildingConcepts(brief));
  const selected=r.options.map(o=>generateBuildingConcepts(brief,24,o.family).plans[o.index]);
  assert.equal(new Set(selected.map(visibleInteriorSignature)).size,selected.length);
  assert.equal(r.detailedCount,r.options.filter(o=>o.detailed).length);
  for(const o of r.options){assert.equal(generateBuildingConcepts(brief,24,o.family).plans[o.index].id,o.id);assert.ok(o.primaryAreaShare>0&&o.primaryAreaShare<1);}
 }
});
test("L plot alternatives remain contained and preserve boundary identity through save",()=>{
 const points=parsePlot("0,0\n180,0\n180,130\n100,130\n100,240\n0,240")!;
 const fits=roadEnvelopeChoices(points);assert.ok(fits.length>=2&&fits.length<=6);
 assert.ok(fits.every(r=>envelopeFits(points,r)));
 const fit=fits.find(r=>r.w>=100&&r.d>=200)!;assert.ok(fit);
 const brief={...buildingStarter("rental"),widthFt:fit.w,depthFt:fit.d,siteContext:{points,offsetXFt:fit.x}};
 const plan=generateBuildingConcepts(brief,24,"purpose-led").plans[0];assert.ok(plan);
 assert.notEqual(plan.id,generateBuildingConcepts({...brief,siteContext:undefined},24,"purpose-led").plans[0].id);
 assert.equal(generateBuildingConcepts({...brief,widthFt:400},24,"purpose-led").plans.length,0);
 const input=commercialSaveSchema.parse({idempotencyKey:"c71a9c10-4c52-4df4-85b7-04d0efbb181f",title:"Measured rental site",brief,planId:plan.id,signature:plan.signature,finishes:defaultFinishScheme({kind:"commercial",plan})});
 const rebuilt=rebuildCommercialSnapshot(input);assert.ok(rebuilt);assert.deepEqual(rebuilt.plan.brief.siteContext,brief.siteContext);
 assert.equal(rebuildCommercialSnapshot({...input,brief:{...brief,siteContext:{points,offsetXFt:70}}}),null);
});
