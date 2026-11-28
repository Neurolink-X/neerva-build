import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts,type BuildingConcept} from "./building-purpose.ts";
import {commercialPortals,commercialGeometryIssues} from "./commercial-detail.ts";
import {commercialAirSpaces,commercialExposure,additionalCommercialGlazing,commercialAirReport} from "./commercial-ventilation.ts";
test("commercial air candidates belong to actual rooms, stay on walls and have screened exposure",()=>{
 let additions=0;
 for(const purpose of ["shops","mall","school","restaurant","rental"] as const){
  const plans=generateBuildingConcepts(buildingStarter(purpose),3).plans;assert.ok(plans.length,purpose);
  for(const plan of plans){const portals=commercialPortals(plan);assert.deepEqual(commercialGeometryIssues(plan),[]);const rooms=commercialAirSpaces(plan);
   for(const p of portals.filter(p=>p.id.includes("-air-"))){const r=rooms.find(r=>r.id===p.zoneId);assert.ok(r);assert.notEqual(commercialExposure(plan,r,p),"review");additions++;}
   for(let f=0;f<plan.brief.floors;f++)assert.ok(commercialAirReport(plan,portals,f).every(r=>r.exposed<=r.glazing.length));
  }
 }
 // Explicit isolated room: unblocked left wall, then a covered adjoining strip.
 const plan:BuildingConcept={id:"test",brief:{...buildingStarter("shops"),widthFt:40,depthFt:50,floors:1},zones:[{id:"room",floor:0,kind:"primary",label:"Room",x:5,y:10,w:10,d:10}],layout:"test",signature:"test",conceptOnly:true};
 assert.equal(additionalCommercialGlazing(plan,[]).length,1);
 const blocked={...plan,zones:[...plan.zones,{id:"front",floor:0,kind:"primary" as const,label:"Block",x:5,y:0,w:10,d:10}]};
 const opening=additionalCommercialGlazing(plan,[])[0];assert.equal(commercialExposure(blocked,plan.zones[0],opening),"review");
});
