import test from "node:test";
import assert from "node:assert/strict";
import {buildingStarter,generateBuildingConcepts} from "./building-purpose.ts";
import {conceptReferenceGrid} from "./commercial-reference-grid.ts";
test("reference axes use selected geometry and bound requested spacing",()=>{
 const plan=generateBuildingConcepts(buildingStarter("mall")).plans[0];assert.ok(plan);
 const grid=conceptReferenceGrid(plan,{spanXFt:20,spanYFt:25});assert.ok(grid);
 assert.equal(grid.approval,"REFERENCE_ONLY");assert.ok(grid.actualXFt<=20&&grid.actualYFt<=25);
 assert.ok(grid.nodes.length>0);assert.ok(grid.nodes.every(n=>n.levels.length>0&&n.levels.every(f=>f>=0&&f<plan.brief.floors)));
 assert.equal(conceptReferenceGrid(plan,{spanXFt:0,spanYFt:25}),null);
 assert.equal(conceptReferenceGrid(plan,{spanXFt:NaN,spanYFt:25}),null);
});
