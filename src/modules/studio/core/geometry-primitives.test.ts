import test from "node:test";
import assert from "node:assert/strict";
import {FEET_TO_METRES,normalize,cross} from "./geometry-primitives.ts";
test("shared geometry primitives preserve units and camera axes",()=>{
 assert.equal(FEET_TO_METRES,.3048);assert.deepEqual(normalize([0,0,0]),[0,0,0]);
 assert.deepEqual(normalize([3,4,0]),[.6,.8,0]);assert.deepEqual(cross([1,0,0],[0,1,0]),[0,0,1]);
});
