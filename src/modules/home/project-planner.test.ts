import test from "node:test";
import assert from "node:assert/strict";
import {initialProject,parseProject,projectStats,taskIds,toggleTask} from "./project-planner.ts";
test("project storage rejects unknown stages, invalid money and duplicate tasks",()=>{const p=parseProject({stage:"unknown",budget:-20,spent:Infinity,done:[taskIds[0],taskIds[0],"bad"]});assert.equal(p.stage,"planning");assert.equal(p.budget,0);assert.equal(p.spent,0);assert.deepEqual(p.done,[taskIds[0]])});
test("progress and budget reflect only user-controlled entries",()=>{let p=parseProject({stage:"finishes",budget:100000,spent:120000,done:[]});assert.equal(projectStats(p).balance,-20000);p=toggleTask(p,taskIds[0]);assert.equal(projectStats(p).completed,1);assert.equal(projectStats(toggleTask(p,taskIds[0])).completed,0);assert.deepEqual(toggleTask(initialProject,"bad"),initialProject)});
