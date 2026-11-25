import test from "node:test";import assert from "node:assert/strict";
import {assessPerformance} from "../../../scripts/release/performance-budget.mjs";
test("targets flag slow samples and severe ceilings block release",()=>{assert.deepEqual(assessPerformance({lcpMs:2000,cls:0.05,ttfbMs:500}),{warnings:[],failures:[]});assert.equal(assessPerformance({lcpMs:3000,cls:0.15,ttfbMs:900}).warnings.length,3);assert.equal(assessPerformance({lcpMs:9000,cls:0.3,ttfbMs:5000}).failures.length,3);assert.equal(assessPerformance({}).warnings.length,3)});
