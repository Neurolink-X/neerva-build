import test from "node:test";
import assert from "node:assert/strict";
import {GOOD_VITALS,toVitalSample} from "./field-vitals.ts";
test("actual vitals thresholds and missing data are not invented",()=>{
 for(const [name,limit] of Object.entries(GOOD_VITALS)){
  assert.equal(toVitalSample(name,limit,390)?.rating,"good");
  assert.equal(toVitalSample(name,limit+.01,390)?.rating,"needs-improvement");
  assert.equal(toVitalSample(name,NaN,390),null);
 }
 assert.equal(toVitalSample("TBT",0,390),null);
 assert.equal(toVitalSample("INP",501,1440)?.rating,"poor");
 assert.equal(toVitalSample("CLS",0,390)?.viewport,"mobile-width");
});
