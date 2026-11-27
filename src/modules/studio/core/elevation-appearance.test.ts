import test from "node:test";
import assert from "node:assert/strict";
import {elevationProfiles,facadeShade,glazingBayCount} from "./elevation-appearance.ts";
import {buildingPurposes} from "../building-purpose.ts";
test("five distinct elevation material profiles, bounded non-structural trim and shared glazing rhythm",()=>{
 assert.deepEqual(Object.keys(elevationProfiles).sort(),[...buildingPurposes].sort());
 assert.equal(new Set(Object.values(elevationProfiles).map(p=>p.title)).size,5);
 for(const p of Object.values(elevationProfiles)){assert.ok(p.bandDepth>0&&p.trimDepth>p.bandDepth&&p.trimDepth<.25);assert.ok(p.glassOpacity>0&&p.glassOpacity<1);}
 assert.equal(glazingBayCount(1.35),1);assert.equal(glazingBayCount(2.7),2);
 assert.equal(facadeShade("#808080",.5),"#404040");assert.equal(facadeShade("#ffffff",1.2),"#ffffff");
});
