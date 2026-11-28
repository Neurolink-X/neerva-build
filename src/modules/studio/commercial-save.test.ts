import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts,commercialPortfolioForId} from "./building-purpose.ts";
import {defaultFinishScheme} from "./finish-model.ts";
import {commercialSaveSchema,rebuildCommercialSnapshot} from "./commercial-save.ts";
test("commercial snapshots are regenerated from bounded inputs and matched to finish identities",()=>{
 const brief=buildingStarter("school"),plan=generateBuildingConcepts(brief,24).plans[0];assert.ok(plan);
 const input=commercialSaveSchema.parse({idempotencyKey:"c71a9c10-4c52-4df4-85b7-04d0efbb181f",title:"School concept",brief,planId:plan.id,signature:plan.signature,finishes:defaultFinishScheme({kind:"commercial",plan})});
 const snapshot=rebuildCommercialSnapshot(input);assert.ok(snapshot);assert.equal(snapshot.plan.id,plan.id);
 assert.equal(rebuildCommercialSnapshot({...input,signature:"wrong"}),null);
 assert.equal(rebuildCommercialSnapshot({...input,finishes:{...input.finishes,planId:"wrong"}}),null);
 assert.equal(commercialSaveSchema.safeParse({...input,owner_id:"attacker"}).success,false);
 assert.equal(commercialSaveSchema.safeParse({...input,brief:{...brief,floors:99}}).success,false);
});

test("new purpose-led snapshots coexist with old saved projects",()=>{
 const brief={...buildingStarter("restaurant"),widthFt:180,depthFt:240};
 for(const family of ["classic","purpose-led","side-gallery"] as const){
  const plan=generateBuildingConcepts(brief,24,family).plans[0];assert.ok(plan);
  const input=commercialSaveSchema.parse({idempotencyKey:"c71a9c10-4c52-4df4-85b7-04d0efbb181f",title:"Restaurant concept",brief,planId:plan.id,signature:plan.signature,finishes:defaultFinishScheme({kind:"commercial",plan})});
  assert.equal(rebuildCommercialSnapshot(input)?.plan.signature,plan.signature);
 }
});

test("internal service variants can be rebuilt by exact identity",()=>{
 const b={...buildingStarter("restaurant"),widthFt:180,depthFt:240};
 const current=generateBuildingConcepts(b,24,"internal").plans;assert.ok(current.length);
 for(const p of current){assert.ok(commercialPortfolioForId(b,p.id).plans.some(q=>q.id===p.id&&q.signature===p.signature));}
});
