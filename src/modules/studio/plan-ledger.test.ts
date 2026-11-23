import test from "node:test";
import assert from "node:assert/strict";
import {generateRoadPlans} from "./road-generator.ts";
import {planAreaLedger,preliminaryMaterialQuantities} from "./plan-ledger.ts";
import {canPublishPlan,draftRegulations,regulationEvidenceErrors} from "./city-rules.ts";
const base={widthFt:18,depthFt:50,roadSide:"N" as const,floors:2 as const,bedrooms:3,parking:true,
 setbacks:{frontFt:0,rearFt:0,leftFt:0,rightFt:0}};
test("18x50 G/G+1 exact room+open+parking area reconciliation and zero overlaps",()=>{
 for(const floors of [1,2] as const)for(const p of generateRoadPlans({...base,floors,bedrooms:floors===1?1:3}).plans){
  const ledger=planAreaLedger(p);
  assert.equal(ledger.length,floors);
  ledger.forEach(a=>{assert.equal(a.usableSqFt,900);assert.equal(a.unallocatedSqFt,0);assert.equal(a.overlapSqFt,0);assert.ok(a.reconciles)});
 }
});
test("quantities change with validated rooms and openings; no imaginary rebar/cement prices",()=>{
 const p=generateRoadPlans(base).plans[0];assert.ok(p);
 const standard=preliminaryMaterialQuantities(p);
 const moreWaste=preliminaryMaterialQuantities(p,{wastePercent:20});
 assert.ok(standard.windows>0&&standard.distinctDoorOpenings>0);
 assert.ok(moreWaste.paintLitres>standard.paintLitres);
 assert.equal(standard.materialPricesVerified,false);
 assert.equal(standard.structuralItemsAvailable,false);
 assert.throws(()=>preliminaryMaterialQuantities(p,{coverageSqMPerL:0}),RangeError);
});
test("city profile stays unpublished until authority signed source/FAR and verified model setbacks exist",()=>{
 const p=generateRoadPlans(base).plans[0];
 for(const profile of Object.values(draftRegulations)){
  assert.ok(regulationEvidenceErrors(profile).length>0);
  assert.equal(canPublishPlan(p,profile),false);
 }
});
