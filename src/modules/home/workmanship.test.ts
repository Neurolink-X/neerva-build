
import test from "node:test";import assert from "node:assert/strict";
import {workmanshipChecks} from "./workmanship.ts";import {chapters} from "./handbook.ts";
test("workmanship records have unique stable anchors, observable warning signs and practical actions",()=>{assert.equal(new Set(workmanshipChecks.map(c=>c.id)).size,workmanshipChecks.length);assert.ok(workmanshipChecks.length>=8);for(const c of workmanshipChecks){assert.ok(chapters.some(x=>x.id===c.stage));assert.ok(c.good.length>30&&c.warning.length>30&&c.action.length>40&&c.hindi.length>20&&c.tools.length>8)}});
