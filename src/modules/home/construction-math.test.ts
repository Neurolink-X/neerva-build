
import test from "node:test";
import assert from "node:assert/strict";
import {masonryTakeoff,concreteTakeoff,steelTakeoff,areaBudget} from "./construction-math.ts";
test("brick modular volume and openings",()=>{
 const r=masonryTakeoff(10,10,200,0,[190,90,90],10,5)!;
 assert.equal(r.units,976);
 assert.ok(masonryTakeoff(10,10,200,20,[190,90,90],10,5)!.units<r.units);
 assert.equal(masonryTakeoff(10,10,200,101,[190,90,90],10,5),null);
});
test("approved concrete inputs and 50 kg bags",()=>{assert.equal(concreteTakeoff(2,350,700,1100,0)!.bags,14);assert.equal(concreteTakeoff(-1,350,700,1100,0),null)});
test("steel uses actual measured bar length",()=>{assert.ok(Math.abs(steelTakeoff(12,1000,0)!.kg-887.8)<1);assert.equal(steelTakeoff(0,1000,0),null)});
test("budget allowance and bad input",()=>{assert.equal(areaBudget(1000,2000,10)!.total,2200000);assert.equal(areaBudget(NaN,2000,10),null)});
