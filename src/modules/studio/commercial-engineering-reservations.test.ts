import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts,buildingPurposes} from "./building-purpose.ts";
import {overlapArea} from "./plan-model.ts";
import {fitVerticalReservations,auditCandidateAccess,conceptServiceLoads} from "./commercial-engineering-reservations.ts";
test("vertical reservations stay inside the same core on every level, never overlap",()=>{
 for(const purpose of buildingPurposes){
  const plan=generateBuildingConcepts(buildingStarter(purpose)).plans[0];assert.ok(plan);
  const result=fitVerticalReservations(plan,[{id:"lift",kind:"lift",widthFt:4,depthFt:5,count:2},{id:"stair",kind:"stair",widthFt:5,depthFt:6,count:1}]);assert.ok(result);assert.equal(result.unplaced.length,0);
  assert.equal(result.placed.length,3*plan.brief.floors);
  for(const p of result.placed){const core=plan.zones.find(z=>z.id===p.coreId);assert.ok(core);assert.ok(Math.abs(overlapArea(p,core)-p.w*p.d)<1e-5);}
  for(let i=0;i<result.placed.length;i++)for(let j=i+1;j<result.placed.length;j++)if(result.placed[i].floor===result.placed[j].floor)assert.equal(overlapArea(result.placed[i],result.placed[j]),0);
  assert.equal(fitVerticalReservations(plan,[{id:"too-large",kind:"lift",widthFt:100,depthFt:100,count:1}])?.unplaced.length,1);
  assert.equal(fitVerticalReservations(plan,[{id:"bad",kind:"lift",widthFt:NaN,depthFt:5,count:1}]),null);
  const access=auditCandidateAccess(plan,0);assert.ok(access);assert.equal(access.approval,"NOT_VERIFIED");assert.ok(access.connectedCoreCount<=2);
 }
});
test("service arithmetic is independent and invalid assumptions do not produce quantities",()=>{
 const result=conceptServiceLoads({areaSqFt:1000,people:20,powerWPerM2:100,waterLPerPersonDay:50,airLpsPerPerson:8,coolingWPerM2:NaN,reserveHours:12});
 assert.equal(result.waterLPerDay,1000);assert.equal(result.waterReserveL,500);assert.equal(result.outdoorAirLps,160);assert.equal(result.coolingKw,null);assert.ok(Math.abs(result.electricalKw!-9.290304)<1e-8);
 assert.equal(conceptServiceLoads({areaSqFt:1000,people:1.5,powerWPerM2:100,waterLPerPersonDay:50,airLpsPerPerson:8,coolingWPerM2:50,reserveHours:12}).waterLPerDay,null);
});
