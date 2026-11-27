import test from "node:test";
import assert from "node:assert/strict";
import {buildingPurposes,buildingStarter,generateBuildingConcepts} from "./building-purpose.ts";
import {commercialMaterialBasis,commercialFinishQuantities} from "./commercial-material-basis.ts";
test("material measurements follow each valid building model and its floors",()=>{
 for(const purpose of buildingPurposes){
  const plan=generateBuildingConcepts(buildingStarter(purpose)).plans[0];assert.ok(plan);
  const result=commercialMaterialBasis(plan);assert.ok(result);assert.equal(result.floors.length,plan.brief.floors);
  for(const row of result.floors){assert.ok(row.floorSqFt>0&&row.faceSqFt>0&&row.grossWallM3>0&&row.grossSlabM3>0);assert.equal(row.roofSqFt>0,row.floor===plan.brief.floors-1);}
 }
});
test("coverage, coats, wastage and pack rounding remain explicit",()=>{
 const input={floorSqFt:100,faceSqFt:100,paintFaces:1 as const,coverageM2PerL:10,coats:2,paintWastePercent:10,tileCoverageSqFtPerBox:10,tileWastePercent:10};
 assert.deepEqual(commercialFinishQuantities(input),{paintLitres:3,tileBoxes:11});
 assert.equal(commercialFinishQuantities({...input,coverageM2PerL:0}),null);
 assert.equal(commercialFinishQuantities({...input,tileWastePercent:NaN}),null);
 assert.equal(commercialFinishQuantities({...input,coats:1.5}),null);
});
